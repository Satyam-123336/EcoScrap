import os
import shutil
from pathlib import Path

def merge_charging_datasets():
    

    
    base_dir = Path('dataset')
    chargers_dir = base_dir / 'Chargers'
    usb_cable_dir = base_dir / 'USB cable'
    merged_dir = base_dir / 'Charging and Connectivity Accessories'

    print(" Starting dataset merge process...")
    print(f"Chargers folder: {chargers_dir} ({len(list(chargers_dir.glob('*.jpg')))} images)")
    print(f"USB cable folder: {usb_cable_dir} ({len(list(usb_cable_dir.glob('*.jpg')))} images)")

    
    merged_dir.mkdir(exist_ok=True)
    print(f" Created merged directory: {merged_dir}")

    
    chargers_images = list(chargers_dir.glob('*.jpg'))
    for i, img_path in enumerate(chargers_images):
        new_name = f"charger_{i+1:03d}_{img_path.name}"
        shutil.copy2(img_path, merged_dir / new_name)
        if (i + 1) % 50 == 0:
            print(f"   Copied {i+1}/{len(chargers_images)} charger images")

    
    usb_images = list(usb_cable_dir.glob('*.jpg'))
    for i, img_path in enumerate(usb_images):
        new_name = f"usb_cable_{i+1:03d}_{img_path.name}"
        shutil.copy2(img_path, merged_dir / new_name)
        if (i + 1) % 50 == 0:
            print(f"   Copied {i+1}/{len(usb_images)} USB cable images")

    
    total_images = len(list(merged_dir.glob('*.jpg')))
    print("\n Dataset merge completed!")
    print(f" Total images in merged category: {total_images}")
    print(f"   - Chargers: {len(chargers_images)}")
    print(f"   - USB cables: {len(usb_images)}")
    print(f"   - Total: {len(chargers_images) + len(usb_images)}")

    if total_images == len(chargers_images) + len(usb_images):
        print(" All images successfully merged!")
    else:
        print("  Warning: Some images may not have been copied correctly")

    return merged_dir

def update_model_categories():
    

    print("\n Updating model category mappings...")

    
    model_server_path = Path('model_server.py')
    if model_server_path.exists():
        with open(model_server_path, 'r') as f:
            content = f.read()

        
        old_categories = "['Audio devices', 'Battery', 'Chargers', 'Hard Drive', 'Keyboard', 'Mobile', 'Mouse', 'PCB', 'Pen Drive', 'USB cable']"
        new_categories = "['Audio devices', 'Battery', 'Charging and Connectivity Accessories', 'Hard Drive', 'Keyboard', 'Mobile', 'Mouse', 'PCB', 'Pen Drive']"

        if old_categories in content:
            content = content.replace(old_categories, new_categories)
            with open(model_server_path, 'w') as f:
                f.write(content)
            print(" Updated model_server.py categories")
        else:
            print("  Could not find category list in model_server.py")

    
    model_service_path = Path('server/modelService.ts')
    if model_service_path.exists():
        with open(model_service_path, 'r') as f:
            content = f.read()

        
        old_mapping = "'Chargers': 'Chargers',\n      'USB cable': 'USB cable',"
        new_mapping = "'Charging and Connectivity Accessories': 'Charging and Connectivity Accessories',"

        if old_mapping in content:
            content = content.replace(old_mapping, new_mapping)
            with open(model_service_path, 'w') as f:
                f.write(content)
            print(" Updated server/modelService.ts categories")
        else:
            print("  Could not find category mapping in server/modelService.ts")

    
    frontend_path = Path('client/src/components/pickup/request-form.tsx')
    if frontend_path.exists():
        with open(frontend_path, 'r') as f:
            content = f.read()

        
        old_frontend = "{ value: 'Chargers', label: 'Chargers', icon: Zap },\n        { value: 'USB cable', label: 'USB Cable', icon: Cable }"
        new_frontend = "{ value: 'Charging and Connectivity Accessories', label: 'Charging & Connectivity', icon: Zap }"

        if old_frontend in content:
            content = content.replace(old_frontend, new_frontend)
            with open(frontend_path, 'w') as f:
                f.write(content)
            print(" Updated frontend categories")
        else:
            print("  Could not find frontend categories")

def create_backup():
    
    print(" Creating backup of original folders...")

    backup_dir = Path('dataset_backup')
    backup_dir.mkdir(exist_ok=True)

    
    chargers_backup = backup_dir / 'Chargers'
    usb_backup = backup_dir / 'USB cable'

    if Path('dataset/Chargers').exists():
        shutil.copytree('dataset/Chargers', chargers_backup, dirs_exist_ok=True)
        print(" Backed up Chargers folder")

    if Path('dataset/USB cable').exists():
        shutil.copytree('dataset/USB cable', usb_backup, dirs_exist_ok=True)
        print(" Backed up USB cable folder")

    return backup_dir

def main():
    
    print(" Starting Dataset Merge Process")
    print("=" * 50)

    
    backup_dir = create_backup()

    
    merged_dir = merge_charging_datasets()

    
    update_model_categories()

    print("\n" + "=" * 50)
    print(" Dataset merge completed successfully!")
    print(f" Merged folder: {merged_dir}")
    print(f" Backup location: {backup_dir}")
    print("\n Next steps:")
    print("1. Review the merged images in 'dataset/Charging and Connectivity Accessories/'")
    print("2. Retrain your model with the updated dataset")
    print("3. Test the model performance on the merged category")
    print("4. Update any remaining references to the old category names")

    print("\n  Important: The original 'Chargers' and 'USB cable' folders are still present.")
    print("   You can safely delete them after verifying the merge is correct.")

if __name__ == "__main__":
    main()

