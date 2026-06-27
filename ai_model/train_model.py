#!/usr/bin/env python3


import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import matplotlib.pyplot as plt
import os

def main():
    print(" Starting E-Waste Classification Model Training")
    print("=" * 50)

    
    dataset = r"C:\Users\Acer\Desktop\EcoScrapPickup\EcoScrapPickup\dataset"

    if not os.path.exists(dataset):
        print(f" Dataset path not found: {dataset}")
        return

    print(f" Dataset path: {dataset}")

    
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        shear_range=0.2,
        brightness_range=(0.8, 1.2),  
        fill_mode="nearest"
    )

    val_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

    print(" Loading training data...")
    train_data = train_datagen.flow_from_directory(
        dataset,
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        subset="training",
        shuffle=True,
        seed=42
    )

    print(" Loading validation data...")
    val_data = val_datagen.flow_from_directory(
        dataset,
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
        seed=42
    )

    print(f" Found {train_data.num_classes} classes:")
    for class_name in sorted(train_data.class_indices.keys()):
        print(f"   - {class_name}")

    
    print("  Building model with MobileNetV2...")
    base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = True  

    
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    
    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dropout(0.3),
        Dense(128, activation="relu"),
        Dropout(0.2),
        Dense(train_data.num_classes, activation="softmax")
    ])

    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )

    print(" Model Summary:")
    model.summary()

    
    callbacks = [
        EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        ModelCheckpoint("best_model.h5", monitor="val_accuracy", save_best_only=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6)
    ]

    
    print(" Starting training...")
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=30,  
        callbacks=callbacks
    )

    
    print(" Generating training plots...")
    plt.figure(figsize=(12, 4))

    plt.subplot(1, 2, 1)
    plt.plot(history.history["accuracy"], label="train_acc")
    plt.plot(history.history["val_accuracy"], label="val_acc")
    plt.legend()
    plt.title("Training vs Validation Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")

    plt.subplot(1, 2, 2)
    plt.plot(history.history["loss"], label="train_loss")
    plt.plot(history.history["val_loss"], label="val_loss")
    plt.legend()
    plt.title("Training vs Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")

    plt.tight_layout()
    plt.savefig("training_history.png", dpi=300, bbox_inches='tight')
    plt.show()

    
    print(" Saving model...")
    model.save("ewaste_model_finetuned.h5")

    print(" Model saved successfully!")
    print(f" Model trained on {train_data.num_classes} classes:")
    for class_name in sorted(train_data.class_indices.keys()):
        print(f"   - {class_name}")

    print("\n Training completed successfully!")
    print(" Files saved:")
    print("   - ewaste_model_finetuned.h5 (main model)")
    print("   - best_model.h5 (best checkpoint)")
    print("   - training_history.png (performance plots)")

if __name__ == "__main__":
    main()

