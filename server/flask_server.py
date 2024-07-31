from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
import logging
import json

app = Flask(__name__)
CORS(app)

# Load your data
data = pd.read_csv('data.csv')

@app.route('/columns', methods=['GET'])
def get_columns():
    # Extract column names from the DataFrame
    column_names = data.columns.tolist()
    return jsonify(column_names)

def clean_percentage(value):
    """Convert percentage strings to float numbers."""
    if isinstance(value, str) and '%' in value:
        # Remove the percentage sign and convert to float
        return float(value.replace('%', ''))
    return value

@app.route('/getdata', methods=['GET'])
def get_data():
    column_name = request.args.get('column', 'GDP per capita')

    if column_name not in data.columns:
        return jsonify({'error': 'Column not found'}), 404

    # Apply cleaning function to the column if it contains percentage signs
    if data[column_name].dtype == 'object' and '%' in data[column_name].iloc[0]:
        data[column_name] = data[column_name].apply(clean_percentage)

    # Prepare data to be JSON serializable, including only non-NaN entries
    response_data = data[['Country name', column_name]].dropna().to_dict(orient='records')
    return jsonify(response_data)

# Configure logging
logging.basicConfig(level=logging.DEBUG)  # Set the logging level to DEBUG
import numpy as np  # Import NumPy for handling NaN values

@app.route('/country-info', methods=['GET'])
def get_country_info():
    selected_countries_str = request.args.get('countries', '')

    # Split the selected countries by comma
    selected_countries = [country.strip().lower() for country in selected_countries_str.split(',') if country.strip()]

    logging.debug(f"Selected countries: {selected_countries}")

    # Convert all country names in the dataset to lowercase for case-insensitive comparison
    valid_countries = set(data['Country name'].str.strip().str.lower())

    # Convert all country names in the dataset to lowercase for case-insensitive comparison
    invalid_countries = [country for country in selected_countries if country.lower() not in valid_countries]

    if invalid_countries:
        error_message = f"Invalid countries: {', '.join(invalid_countries)}"
        logging.error(error_message)
        return jsonify({"error": error_message}), 400

    # Extract information for the selected countries
    result = {}
    for country in selected_countries:
        country_info = data[data['Country name'].str.strip().str.lower() == country.lower()].to_dict(orient='records')[0]
        
        # Handle NaN values in country_info
        country_info = {k: v if not isinstance(v, float) or not np.isnan(v) else None for k, v in country_info.items()}
        
        result[country] = country_info

    return jsonify(result)

def clean_data(value):
    if isinstance(value, str):
        # Remove % and other non-numeric characters except for the negative sign and decimal point
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            # Convert to float first to preserve any decimals
            return float(cleaned)
        except ValueError:
            return None  # Return None if conversion fails
    elif isinstance(value, (int, float)):  # Handle numeric types that might be directly usable or NaN
        return value if not pd.isna(value) else None
    return None  # Ensure that all other types are converted to None if not specifically handled


@app.route('/scatter_data')
def scatter_data():
    column_name = request.args.get('column', 'GDP per capita')
    
    if column_name not in data.columns:
        return jsonify({'error': 'Column not found'}), 404

    scatter_plot_data = {
        'ladder_score': [],
        column_name: [],
        'country_name': []
    }
    
    try:
        for _, row in data.iterrows():
            ladder_score = clean_data(row['Ladder score'])
            column_value = clean_data(row[column_name])
            
            if ladder_score is not None and column_value is not None:  # Check both values are not None
                scatter_plot_data['ladder_score'].append(ladder_score)
                scatter_plot_data[column_name].append(column_value)
                scatter_plot_data['country_name'].append(row['Country name'])

        return jsonify(scatter_plot_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/pie-chart')
def average_happiness():
    region_group = data.groupby('Region')['Ladder score'].mean().reset_index()
    result = region_group.to_dict(orient='records')  # Converts DataFrame to list of dicts
    return jsonify(result)

def clean_data_pcp(value):
    if isinstance(value, str):
        # Remove % and other non-numeric characters except for the negative sign and decimal point
        cleaned = ''.join(c for c in value if c.isdigit() or c in ['-', '.'])
        try:
            # Convert to float first to preserve any decimals, then to int if needed
            return float(cleaned)
        except ValueError:
            return None  # Return None if conversion fails
    return value

@app.route('/pcp')
def pcp_data():
    # Manually specify the columns to send
    cleaned_data = clean_data_pcp(data.copy())
    categorical_columns = ['Country name', 'Region', 'Income Category']  # List categorical columns
    mappings = {}
    for column in categorical_columns:
        # pandas factorize returns two objects: an array and an Index of unique labels
        cleaned_data[column], labels = pd.factorize(cleaned_data[column])
        mappings[column] = dict(enumerate(labels))
    columns_to_send = ['Country name', 'Ladder score', 'GDP per capita', 'Social support','Healthy life expectancy','Freedom to make life choices',
                       'Generosity','Perceptions of corruption', 'Region', 'Income Category']
    filtered_data = cleaned_data[columns_to_send]

    return jsonify({'data': filtered_data.to_dict(orient='records'), 'mappings': mappings})

if __name__ == '__main__':
    app.run(debug=True)
