#!/usr/bin/env python3
"""
Test script to verify the model server is working correctly
"""

import requests
import base64
import os
import sys

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get('http://127.0.0.1:5001/health')
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to model server: {e}")
        print("Please make sure the server is running on port 5001")
        return False

def test_prediction_with_sample_image():
    """Test prediction with a sample image from the dataset"""
    
    # Try to find a sample image from the dataset
    dataset_path = "dataset"
    sample_image = None
    category = None
    
    if os.path.exists(dataset_path):
        # Try each category
        categories = ['Mobile', 'Keyboard', 'Mouse', 'Battery', 'Hard Drive']
        for cat in categories:
            cat_path = os.path.join(dataset_path, cat)
            if os.path.exists(cat_path):
                files = [f for f in os.listdir(cat_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if files:
                    sample_image = os.path.join(cat_path, files[0])
                    category = cat
                    break
    
    if not sample_image:
        print("⚠️  No sample images found in dataset folder")
        print("Please provide a path to a test image, or check that the dataset folder exists")
        return False
    
    print(f"\n📸 Testing with sample image: {sample_image}")
    print(f"   Expected category: {category}")
    
    try:
        # Read and encode the image
        with open(sample_image, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Send prediction request
        response = requests.post(
            'http://127.0.0.1:5001/predict',
            json={'image': image_data},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Prediction successful!")
            print(f"   Classification: {result['classification']}")
            print(f"   Confidence: {result['confidence']:.2%}")
            print(f"   Recyclable: {result['recyclable']}")
            print(f"   Estimated Weight: {result['estimatedWeight']}")
            print(f"   Suggestions: {', '.join(result['suggestions'][:2])}")
            
            # Check if prediction matches expected category
            if result['classification'] == category:
                print(f"\n🎯 Perfect! Prediction matches expected category!")
            else:
                print(f"\n⚠️  Prediction ({result['classification']}) differs from expected ({category})")
                print(f"   This could be normal if the image is ambiguous or the model needs more training")
            
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
        return False

def test_batch_prediction():
    """Test batch prediction if multiple images are available"""
    dataset_path = "dataset"
    
    if not os.path.exists(dataset_path):
        print("\n⚠️  Skipping batch test - no dataset folder found")
        return False
    
    # Collect a few sample images
    sample_images = []
    categories = ['Mobile', 'Keyboard', 'Mouse']
    
    for cat in categories:
        cat_path = os.path.join(dataset_path, cat)
        if os.path.exists(cat_path):
            files = [f for f in os.listdir(cat_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if files:
                image_path = os.path.join(cat_path, files[0])
                with open(image_path, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
                sample_images.append({
                    'data': image_data,
                    'filename': f'{cat}_sample.jpg'
                })
    
    if len(sample_images) < 2:
        print("\n⚠️  Not enough images for batch test")
        return False
    
    print(f"\n📦 Testing batch prediction with {len(sample_images)} images...")
    
    try:
        response = requests.post(
            'http://127.0.0.1:5001/predict',
            json={'images': sample_images, 'selectedTypes': ['mobile', 'keyboard', 'mouse']},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Batch prediction successful!")
            print(f"   Total images: {result['total_images']}")
            print(f"   Successful predictions: {result['successful_predictions']}")
            print(f"   Type mismatches: {len(result['type_mismatches'])}")
            
            for i, res in enumerate(result['batch_results'][:3]):
                print(f"\n   Image {i+1}: {res.get('filename', 'unknown')}")
                print(f"      Classification: {res.get('classification', 'N/A')}")
                print(f"      Confidence: {res.get('confidence', 0):.2%}")
            
            return True
        else:
            print(f"❌ Batch prediction failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Batch prediction test failed: {e}")
        return False

def main():
    print("🚀 EcoScrap Model Server Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣  Testing health endpoint...")
    if not test_health():
        print("\n❌ Server is not running or not healthy")
        print("Please start the server with: python model_server.py")
        sys.exit(1)
    
    # Test 2: Single image prediction
    print("\n2️⃣  Testing single image prediction...")
    test_prediction_with_sample_image()
    
    # Test 3: Batch prediction
    print("\n3️⃣  Testing batch image prediction...")
    test_batch_prediction()
    
    print("\n" + "=" * 50)
    print("🏁 Test suite completed!")

if __name__ == "__main__":
    main()
