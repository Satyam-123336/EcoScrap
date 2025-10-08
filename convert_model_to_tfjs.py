#!/usr/bin/env python3
"""
Convert TensorFlow/Keras model to TensorFlow.js format
This allows running the model directly in Node.js without a separate Python server
"""

import tensorflowjs as tfjs
import tensorflow as tf
import os

def convert_model_to_tfjs():
    """Convert the Keras model to TensorFlow.js format"""
    
    # Load the existing model
    model_path = 'ewaste_model_finetuned.h5'
    if not os.path.exists(model_path):
        print(f"❌ Model file not found: {model_path}")
        return False
    
    try:
        print("📥 Loading Keras model...")
        model = tf.keras.models.load_model(model_path)
        print("✅ Model loaded successfully!")
        
        # Create output directory
        output_dir = 'model/tfjs_model'
        os.makedirs(output_dir, exist_ok=True)
        
        print("🔄 Converting model to TensorFlow.js format...")
        
        # Convert model to TensorFlow.js
        tfjs.converters.save_keras_model(
            model, 
            output_dir,
            quantization_bytes=2  # Reduce model size with 2-byte quantization
        )
        
        print(f"✅ Model converted successfully!")
        print(f"📁 TensorFlow.js model saved to: {output_dir}")
        print(f"📊 Model files:")
        for file in os.listdir(output_dir):
            file_path = os.path.join(output_dir, file)
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"   - {file} ({size_mb:.2f} MB)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting model: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TensorFlow.js Model Converter")
    print("================================")
    
    # Check if tensorflowjs is installed
    try:
        import tensorflowjs
        print(f"✅ TensorFlowJS version: {tensorflowjs.__version__}")
    except ImportError:
        print("❌ TensorFlowJS not installed. Install it with:")
        print("   pip install tensorflowjs")
        exit(1)
    
    success = convert_model_to_tfjs()
    
    if success:
        print("\n🎉 Conversion completed successfully!")
        print("\nNext steps:")
        print("1. Install @tensorflow/tfjs-node in your Node.js project:")
        print("   npm install @tensorflow/tfjs-node")
        print("2. Load the model in your Node.js code:")
        print("   const tf = require('@tensorflow/tfjs-node');")
        print("   const model = await tf.loadLayersModel('file://./model/tfjs_model/model.json');")
    else:
        print("\n❌ Conversion failed!")