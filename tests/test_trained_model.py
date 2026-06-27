#!/usr/bin/env python3


import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os

def test_model_predictions():
    
    print(" Testing E-Waste Classification Model")
    print("=" * 40)

    
    model_path = "ewaste_model_finetuned.h5"
    if not os.path.exists(model_path):
        print(f" Model file not found: {model_path}")
        print(" The model is still training. This test will use the existing model.")
        return

    try:
        
        print(" Loading model...")
        model = tf.keras.models.load_model(model_path)
        print(" Model loaded successfully!")

        
        categories = [
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

        print(f" Model expects {len(categories)} classes:")
        for i, cat in enumerate(categories):
            print(f"   {i}: {cat}")

        
        print("\n  Testing with sample data...")

        
        dummy_image = np.random.rand(224, 224, 3).astype(np.float32)

        
        img_array = np.expand_dims(dummy_image, axis=0)

        
        predictions = model.predict(img_array, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])

        predicted_category = categories[predicted_class_idx]

        print(" Model prediction test successful!")
        print(f" Confidence: {confidence:.2f}")
        print(f"  Predicted category: {predicted_category}")

        
        print("\n Top 3 predictions:")
        top_indices = np.argsort(predictions[0])[-3:][::-1]
        for i, idx in enumerate(top_indices):
            conf = float(predictions[0][idx])
            print(f"   {i+1}. {categories[idx]}: {conf:.2f}")
        return True

    except Exception as e:
        print(f" Error testing model: {e}")
        return False

def check_dataset_structure():
    
    print("\n Checking dataset structure...")
    dataset_path = r"C:\Users\Acer\Desktop\EcoScrapPickup\EcoScrapPickup\dataset"

    if not os.path.exists(dataset_path):
        print(f" Dataset path not found: {dataset_path}")
        return

    folders = [f for f in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, f))]
    print(f" Found {len(folders)} class folders:")

    total_images = 0
    for folder in sorted(folders):
        folder_path = os.path.join(dataset_path, folder)
        images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"   - {folder}: {len(images)} images")
        total_images += len(images)

    print(f"\n Total images: {total_images}")

if __name__ == "__main__":
    check_dataset_structure()
    test_model_predictions()

