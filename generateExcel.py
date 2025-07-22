# pylint: disable=all
import pandas as pd
import os
import json
import sys

# Get the file name from command-line arguments
if len(sys.argv) != 2:
    print("Please provide the name of the JSON file as an argument.")
    sys.exit(1)

json_file_name = sys.argv[1]
folder_name = "data"
results_folder = "results"
excel_file_name = f"{os.path.splitext(json_file_name)[0]}.xlsx"

# Full path
folder_path = os.path.join(os.getcwd(), folder_name)
json_file_path = os.path.join(folder_path, json_file_name)

# Path for results folder
results_folder_path = os.path.join(os.getcwd(), results_folder)
excel_file_path = os.path.join(results_folder_path, excel_file_name)

# Create folder if it doesn't exist
if not os.path.exists(folder_path):
    os.makedirs(folder_path)
    print(f"Folder '{folder_name}' has been created at {folder_path}")

# Create results folder if it doesn't exist
if not os.path.exists(results_folder_path):
    os.makedirs(results_folder_path)
    print(
        f"Results folder '{results_folder}' has been created at {results_folder_path}"
    )

# Read data from the JSON file
try:
    with open(json_file_path, "r") as file:
        data = json.load(file)
except FileNotFoundError:
    print(f"File {json_file_path} not found. Please make sure the file exists.")
    sys.exit(1)

# Convert to DataFrame
df = pd.DataFrame(data)

# Save to Excel file
df.to_excel(excel_file_path, index=False)
print(f"Excel file has been saved at {excel_file_path}")
