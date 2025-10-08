#!/usr/bin/env python3
"""
Enhanced test script for multiple image classification
Tests both individual and batch prediction functionality
"""

import requests
import base64
import json
import os
from pathlib import Path

def test_multiple_categories():
    """Test multiple image classification with different e-waste categories"""
    
    print("🧪 Testing Multiple Image Classification")
    print("=" * 50)
    
    # Define test images from different categories
    test_cases = [
        {
            'category': 'Mobile',
            'path': 'dataset/Mobile/Mobile_0.jpg',
            'expected': 'Mobile'
        },
        {
            'category': 'Battery',
            'path': 'dataset/Battery/Battery_0.jpg',
            'expected': 'Battery'
        },
        {
            'category': 'Keyboard',
            'path': 'dataset/Keyboard/Keyboard_0.jpg',
            'expected': 'Keyboard'
        },
        {
            'category': 'Mouse',
            'path': 'dataset/Mouse/Mouse_0.jpg',
            'expected': 'Mouse'
        },
        {
            'category': 'Audio devices',
            'path': 'dataset/Audio devices/Audio devices_0.jpg',
            'expected': 'Audio devices'
        }
    ]
    
    # Filter test cases to only include existing files
    available_tests = []
    for test_case in test_cases:
        if os.path.exists(test_case['path']):
            available_tests.append(test_case)
            print(f"✅ Found: {test_case['path']}")
        else:
            print(f"⚠️  Missing: {test_case['path']}")
    
    if not available_tests:
        print("❌ No test images found. Please check your dataset folder.")
        return False
    
    print(f"\n🎯 Testing with {len(available_tests)} images")
    
    # Test 1: Individual predictions
    print("\n" + "="*30)
    print("TEST 1: Individual Predictions")
    print("="*30)
    
    individual_results = []
    for i, test_case in enumerate(available_tests):
        try:
            with open(test_case['path'], 'rb') as f:
                image_data = f.read()
            
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            response = requests.post(
                'http://localhost:5001/predict',
                json={'image': base64_image},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                individual_results.append(result)
                
                print(f"\n📷 Image {i+1}: {test_case['category']}")
                print(f"   🔍 Detected: {result['classification']}")
                print(f"   📊 Confidence: {result['confidence']:.2%}")
                print(f"   ♻️  Recyclable: {result['recyclable']}")
                print(f"   ⚖️  Weight: {result['estimatedWeight']}")
                print(f"   ✅ Match: {'Yes' if result['classification'] == test_case['expected'] else 'No'}")
                
            else:
                print(f"❌ Failed to analyze {test_case['category']}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error processing {test_case['category']}: {e}")
    
    # Test 2: Batch prediction
    print("\n" + "="*30)
    print("TEST 2: Batch Prediction")
    print("="*30)
    
    try:
        # Prepare batch request
        images_data = []
        for test_case in available_tests:
            with open(test_case['path'], 'rb') as f:
                image_data = f.read()
            
            base64_image = base64.b64encode(image_data).decode('utf-8')
            images_data.append({
                'data': base64_image,
                'filename': os.path.basename(test_case['path'])
            })
        
        # Send batch request
        batch_request = {
            'images': images_data,
            'selectedTypes': ['mobile', 'battery', 'keyboard', 'mouse', 'audio_devices']  # All types
        }
        
        response = requests.post(
            'http://localhost:5001/predict',
            json=batch_request,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        if response.status_code == 200:
            batch_result = response.json()
            
            print(f"📊 BATCH RESULTS:")
            print(f"   • Total Images: {batch_result['total_images']}")
            print(f"   • Successful: {batch_result['successful_predictions']}")
            print(f"   • Mismatches: {len(batch_result['type_mismatches'])}")
            
            print(f"\n📋 INDIVIDUAL RESULTS:")
            for result in batch_result['batch_results']:
                mismatch_indicator = "❌" if result.get('mismatch', False) else "✅"
                print(f"   {mismatch_indicator} {result['filename']}: {result['classification']} ({result['confidence']:.2%})")
            
            if batch_result['type_mismatches']:
                print(f"\n⚠️  TYPE MISMATCHES:")
                for mismatch in batch_result['type_mismatches']:
                    print(f"   • {mismatch['filename']}: Expected {mismatch['expected']}, got {mismatch['detected']}")
        else:
            print(f"❌ Batch prediction failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Batch test error: {e}")
    
    # Test 3: Type mismatch detection
    print("\n" + "="*30)
    print("TEST 3: Type Mismatch Detection")
    print("="*30)
    
    try:
        # Send batch request with wrong types to test mismatch detection
        wrong_types_request = {
            'images': images_data[:2],  # Only first 2 images
            'selectedTypes': ['audio_devices']  # Wrong type to trigger mismatch
        }
        
        response = requests.post(
            'http://localhost:5001/predict',
            json=wrong_types_request,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            mismatch_result = response.json()
            
            print(f"🎯 MISMATCH TEST:")
            print(f"   • Expected Type: audio_devices")
            print(f"   • Has Mismatches: {mismatch_result['has_mismatches']}")
            print(f"   • Mismatch Count: {len(mismatch_result['type_mismatches'])}")
            
            if mismatch_result['has_mismatches']:
                print("✅ Mismatch detection working correctly!")
                for mismatch in mismatch_result['type_mismatches']:
                    print(f"   • {mismatch['filename']}: {mismatch['detected']} (should trigger mismatch)")
            else:
                print("⚠️  Mismatch detection may not be working properly")
        
    except Exception as e:
        print(f"❌ Mismatch test error: {e}")
    
    print("\n🎉 Multiple Image Classification Test Complete!")
    print("\n📋 SUMMARY:")
    print(f"   ✅ Individual predictions: {len(individual_results)} successful")
    print(f"   ✅ Batch prediction: Tested")
    print(f"   ✅ Mismatch detection: Tested")
    print(f"   ✅ Multiple categories: {len(set(r['classification'] for r in individual_results))} detected")
    
    return True

def test_health_first():
    """Test if the server is running before running other tests"""
    try:
        response = requests.get('http://localhost:5001/health', timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Server Status: {health_data['status']}")
            print(f"✅ Model Loaded: {health_data['model_loaded']}")
            return health_data['model_loaded']
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("💡 Make sure to run: npm run dev")
        return False

def test_legacy_categories():
    """Legacy test for backward compatibility"""
    test_categories = [
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

    print("\n🔄 Legacy Category Test")
    print("=" * 30)

    dataset_path = Path('./dataset')
    results = []

    for category in test_categories:
        category_path = dataset_path / category
        if not category_path.exists():
            continue

        image_files = list(category_path.glob('*.jpg'))
        if not image_files:
            continue

        image_path = image_files[0]

        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                response = requests.post('http://localhost:5001/predict', files=files)

            if response.status_code == 200:
                result = response.json()
                predicted_category = result['classification']
                confidence = result['confidence']
                is_correct = predicted_category.lower() == category.lower()
                status = "✅ CORRECT" if is_correct else "❌ WRONG"
                print(f"   {status} - {category}: {predicted_category} ({confidence:.1%})")
                results.append({'category': category, 'correct': is_correct})

        except Exception as e:
            print(f"   ❌ Error testing {category}: {e}")

    if results:
        accuracy = len([r for r in results if r['correct']]) / len(results) * 100
        print(f"\n📊 Legacy Test Accuracy: {accuracy:.1f}%")

if __name__ == "__main__":
    print("🚀 EcoScrapPickup Multiple Image Classification Test")
    print("="*60)
    
    # Check if server is running
    if test_health_first():
        print()
        test_multiple_categories()
        test_legacy_categories()
    else:
        print("\n❌ Server not available. Please start the server first.")
        print("   Run: npm run dev")

