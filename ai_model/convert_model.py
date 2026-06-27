import tensorflow as tf
import numpy as np
import os

def convert_model():
    try:
        print("Loading Keras model...")
        model = tf.keras.models.load_model('ewaste_model_finetuned.h5')
        print("Model loaded successfully!")

        print("Model summary:")
        model.summary()

        print("Converting to TensorFlow.js format...")
        
        if not os.path.exists('model'):
            os.makedirs('model')

        
        tf.saved_model.save(model, 'model/saved_model')

        print("Model converted successfully!")
        print("Model saved to: ./model/saved_model")

        
        model.save('model/model.h5')
        print("Backup saved to: ./model/model.h5")

    except Exception as e:
        print(f"Error converting model: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    convert_model()

