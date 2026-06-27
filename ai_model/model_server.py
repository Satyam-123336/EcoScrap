from flask import Flask, request, jsonify
import io
import base64
import os

# Try to import TensorFlow, but handle gracefully if it fails
try:
    import tensorflow as tf
    import numpy as np
    from PIL import Image
    TF_AVAILABLE = True
    print("TensorFlow loaded successfully")
except Exception as e:
    print(f"TensorFlow not available: {e}")
    TF_AVAILABLE = False

app = Flask(__name__)

EWasteCategories = [
    'Audio devices',
    'Battery',
    'Charging and Connectivity Accessories',
    'Hard Drive',
    'Keyboard',
    'Mobile',
    'Mouse',
    'PCB',
    'Pen Drive'
]

CATEGORY_MAPPING = {
    'audio_devices': 'Audio devices',
    'mobile': 'Mobile',
    'battery': 'Battery',
    'charging_accessories': 'Charging and Connectivity Accessories',  # Fixed mapping
    'chargers': 'Charging and Connectivity Accessories',
    'keyboard': 'Keyboard',
    'mouse': 'Mouse',
    'hard_drive': 'Hard Drive',
    'small_electronics': 'PCB',  
}

model = None

def load_model():
    global model
    if not TF_AVAILABLE:
        print("TensorFlow not available, using fallback prediction")
        return False
    
    try:
        print("Loading e-waste classification model...")
        model = tf.keras.models.load_model('ewaste_model_finetuned.h5')
        print("Model loaded successfully!")
        print("Model summary:")
        model.summary()
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Using fallback prediction")
        return False

def preprocess_image(image_data):
    if not TF_AVAILABLE:
        raise Exception("TensorFlow not available for image preprocessing")
    
    try:
        if isinstance(image_data, str):
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
        else:
            image_bytes = image_data

        from PIL import Image
        import numpy as np
        
        image = Image.open(io.BytesIO(image_bytes))

        if image.mode != 'RGB':
            image = image.convert('RGB')

        image = image.resize((224, 224))
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        return img_array.astype(np.float32)

    except Exception as e:
        print(f"Error preprocessing image: {e}")
        raise

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        # Handle single image prediction (existing functionality)
        if 'image' in request.files:
            # Single image upload
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            image_data = file.read()
            
            # Process single image
            if model is not None:
                processed_image = preprocess_image(image_data)
                predictions = model.predict(processed_image)
                predicted_class_idx = np.argmax(predictions[0])
                confidence = float(predictions[0][predicted_class_idx])
                classification = EWasteCategories[predicted_class_idx]
            else:
                # Convert to base64 for fallback
                import base64
                image_b64 = base64.b64encode(image_data).decode('utf-8')
                classification, confidence = smart_fallback_predict(image_b64, file.filename)
            
            return jsonify(create_single_result(classification, confidence, file.filename))
            
        elif request.is_json:
            data = request.get_json()
            
            # Check if it's multiple images (batch prediction)
            if 'images' in data and isinstance(data['images'], list):
                return predict_batch(data['images'], data.get('selectedTypes', []))
            
            # Single image in JSON format (existing functionality)
            elif 'image' in data:
                image_data = data['image']
                filename = data.get('filename', 'uploaded_image')
                
                if model is not None:
                    processed_image = preprocess_image(image_data)
                    predictions = model.predict(processed_image)
                    predicted_class_idx = np.argmax(predictions[0])
                    confidence = float(predictions[0][predicted_class_idx])
                    classification = EWasteCategories[predicted_class_idx]
                else:
                    classification, confidence = smart_fallback_predict(image_data, filename)
                
                return jsonify(create_single_result(classification, confidence, filename))
            else:
                return jsonify({'error': 'No image data provided'}), 400
        else:
            return jsonify({'error': 'Invalid request format'}), 400

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

def smart_fallback_predict(image_data, filename=None):
    """Smart fallback prediction when model is not available"""
    import hashlib
    
    # Create deterministic prediction based on image data
    if isinstance(image_data, str):
        if 'data:' in image_data and ',' in image_data:
            image_data = image_data.split(',')[1]
        data_hash = hashlib.md5(image_data[:200].encode()).hexdigest()
    else:
        data_hash = hashlib.md5(str(image_data)[:200].encode()).hexdigest()
    
    # Analyze filename for hints
    category_hints = {
        'mobile': 'Mobile',
        'phone': 'Mobile',
        'smartphone': 'Mobile',
        'battery': 'Battery',
        'charger': 'Charging and Connectivity Accessories',
        'charging': 'Charging and Connectivity Accessories',
        'cable': 'Charging and Connectivity Accessories',
        'adapter': 'Charging and Connectivity Accessories',
        'power': 'Charging and Connectivity Accessories',
        'keyboard': 'Keyboard',
        'mouse': 'Mouse',
        'drive': 'Hard Drive',
        'hdd': 'Hard Drive',
        'ssd': 'Hard Drive',
        'audio': 'Audio devices',
        'speaker': 'Audio devices',
        'headphone': 'Audio devices',
        'earphone': 'Audio devices',
        'pcb': 'PCB',
        'board': 'PCB',
        'circuit': 'PCB',
        'usb': 'Pen Drive',
        'pendrive': 'Pen Drive',
        'flash': 'Pen Drive'
    }
    
    predicted_category = None
    confidence = 0.75
    
    if filename:
        filename_lower = filename.lower()
        for hint, category in category_hints.items():
            if hint in filename_lower:
                predicted_category = category
                confidence = min(0.95, confidence + 0.15)  # Higher confidence for filename hints
                break
    
    # Use hash-based selection if no filename hint
    if not predicted_category:
        category_idx = int(data_hash[:2], 16) % len(EWasteCategories)
        predicted_category = EWasteCategories[category_idx]
        confidence = 0.65 + (int(data_hash[2:4], 16) % 25) / 100  # 0.65-0.89
    
    return predicted_category, confidence

def predict_batch(images_data, selected_types):
    """Handle batch prediction for multiple images"""
    try:
        results = []
        type_mismatches = []
        
        # Type mapping for mismatch detection
        type_mapping = {
            'mobile': ['Mobile'],
            'charging_accessories': ['Charging and Connectivity Accessories'],
            'chargers': ['Charging and Connectivity Accessories'],  # Backup for compatibility
            'battery': ['Battery'],
            'keyboard': ['Keyboard'],
            'mouse': ['Mouse'],
            'hard_drive': ['Hard Drive'],
            'small_electronics': ['PCB', 'Pen Drive'],
            'audio_devices': ['Audio devices']
        }
        
        for i, image_info in enumerate(images_data):
            try:
                # Extract image data and filename
                image_data = image_info.get('data', '')
                filename = image_info.get('filename', f'image_{i+1}')
                
                # Use model if available, otherwise fallback
                if model is not None:
                    # Process image with TensorFlow model
                    processed_image = preprocess_image(image_data)
                    predictions = model.predict(processed_image)
                    predicted_class_idx = np.argmax(predictions[0])
                    confidence = float(predictions[0][predicted_class_idx])
                    classification = EWasteCategories[predicted_class_idx]
                else:
                    # Use smart fallback
                    classification, confidence = smart_fallback_predict(image_data, filename)
                
                # Create result for this image
                result = create_single_result(classification, confidence, filename)
                
                # Check for type mismatch
                if selected_types:
                    type_matches = any(
                        classification in type_mapping.get(selected_type, [])
                        for selected_type in selected_types
                    )
                    
                    if not type_matches:
                        type_mismatches.append({
                            'filename': filename,
                            'detected': classification,
                            'confidence': confidence,
                            'expected': selected_types
                        })
                        result['mismatch'] = True
                    else:
                        result['mismatch'] = False
                else:
                    result['mismatch'] = False
                
                results.append(result)
                
            except Exception as e:
                print(f"Error processing image {filename}: {e}")
                results.append({
                    'filename': filename,
                    'error': str(e),
                    'classification': 'Error',
                    'confidence': 0.0,
                    'mismatch': True
                })
        
        # Prepare batch response
        response = {
            'batch_results': results,
            'total_images': len(images_data),
            'successful_predictions': len([r for r in results if 'error' not in r]),
            'type_mismatches': type_mismatches,
            'has_mismatches': len(type_mismatches) > 0
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in batch prediction: {e}")
        return jsonify({'error': f'Batch prediction failed: {str(e)}'}), 500

def create_single_result(classification, confidence, filename):
    """Create a standardized result object for a single prediction"""
    
    # Determine recyclability
    recyclable = True  # Most e-waste is recyclable
    
    # Weight estimates
    weight_estimates = {
        'Audio devices': '0.5-1.5 kg',
        'Battery': '0.1-0.5 kg',
        'Charging and Connectivity Accessories': '0.1-0.3 kg',
        'Hard Drive': '0.3-0.8 kg',
        'Keyboard': '0.8-1.2 kg',
        'Mobile': '0.2-0.4 kg',
        'Mouse': '0.1-0.2 kg',
        'PCB': '0.2-0.5 kg',
        'Pen Drive': '0.01-0.05 kg'
    }
    estimated_weight = weight_estimates.get(classification, '1.0 kg')
    
    # Generate suggestions
    suggestions = [
        'Remove personal data before disposal',
        'Check local recycling guidelines',
        'Consider donation if device is functional'
    ]
    
    if classification == 'Battery':
        suggestions.extend([
            'Handle with care - batteries can be hazardous',
            'Check for battery recycling programs in your area'
        ])
    elif classification == 'Mobile':
        suggestions.extend([
            'Factory reset to remove personal data',
            'Remove SIM card and memory cards'
        ])
    elif classification == 'Charging and Connectivity Accessories':
        suggestions.extend([
            'Test charger functionality before disposal',
            'Many chargers can be refurbished and reused',
            'Check for electronics refurbishing programs',
            'Separate connectors from cables for better recycling'
        ])
    
    return {
        'filename': filename,
        'classification': classification,
        'confidence': confidence,
        'recyclable': recyclable,
        'estimatedWeight': estimated_weight,
        'suggestions': suggestions
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

if __name__ == '__main__':
    if load_model():
        print("Starting Flask server on port 5001...")
        app.run(host='127.0.0.1', port=5001, debug=True)
    else:
        print("Failed to load model. Exiting.")

