import numpy as np
import sys


if not hasattr(np, 'object'):
    np.object = object

print("NumPy patched successfully!")
print(f"NumPy version: {np.__version__}")
print(f"np.object available: {hasattr(np, 'object')}")


try:
    import tensorflow as tf
    print("TensorFlow imported successfully!")
    print(f"TensorFlow version: {tf.__version__}")
except ImportError as e:
    print(f"Failed to import TensorFlow: {e}")
    sys.exit(1)


try:
    print("Loading Keras model...")
    model = tf.keras.models.load_model('ewaste_model_finetuned.h5')
    print("Model loaded successfully!")

    print("Model summary:")
    model.summary()

    print("Converting to TensorFlow.js format...")
    import tensorflowjs as tfjs

    
    import os
    if not os.path.exists('model'):
        os.makedirs('model')

    
    tfjs.converters.save_keras_model(model, 'model/')

    print("Model converted successfully!")
    print("Model saved to: ./model/")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

