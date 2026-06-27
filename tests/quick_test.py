#!/usr/bin/env python3
"""Quick test for batch functionality"""

import requests
import json

def test_health():
    """Test server health"""
    try:
        response = requests.get('http://localhost:5001/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server Status: {data['status']}")
            print(f"✅ Model Loaded: {data['model_loaded']}")
            return True
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_batch_endpoint():
    """Test batch endpoint with dummy data"""
    try:
        # Create dummy base64 image data (1x1 pixel PNG)
        dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        batch_request = {
            'images': [
                {'data': dummy_image, 'filename': 'test1.png'},
                {'data': dummy_image, 'filename': 'test2.png'}
            ],
            'selectedTypes': ['mobile', 'battery']
        }
        
        response = requests.post(
            'http://localhost:5001/predict',
            json=batch_request,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Batch request status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Batch endpoint working!")
            print(f"   - Total images: {result.get('total_images', 'N/A')}")
            print(f"   - Successful: {result.get('successful_predictions', 'N/A')}")
            print(f"   - Has mismatches: {result.get('has_mismatches', 'N/A')}")
            return True
        else:
            print(f"❌ Batch request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Batch test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Quick Batch Functionality Test")
    print("=" * 40)
    
    if test_health():
        print()
        test_batch_endpoint()
    else:
        print("❌ Server not ready for testing")