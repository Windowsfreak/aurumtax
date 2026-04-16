import urllib.request
import xml.etree.ElementTree as ET
import json
import os

def convert_xml_to_js(xml_path, output_path, start_year, end_year):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    rates = {}
    
    # Iterate through all 'Obs' elements
    for obs in root.findall('.//{http://www.ecb.europa.eu/vocabulary/stats/exr/1}Obs'):
        date = obs.get('TIME_PERIOD')
        rate = obs.get('OBS_VALUE')
        if date and rate:
            year = int(date.split('-')[0])
            if start_year <= year <= end_year:
                rates[date] = float(rate)

    # Sort by date
    sorted_rates = dict(sorted(rates.items()))

    # Create JS content
    js_content = f"const EXCHANGE_RATES = {json.dumps(sorted_rates, separators=(',', ':'))};"
    
    with open(output_path, 'w') as f:
        f.write(js_content)
    return len(rates)

if __name__ == "__main__":
    xml_file = "/Users/bjoern/projects/bjoern/aurum/usd.xml"
    output_file = "/Users/bjoern/projects/bjoern/aurum/rates.js"
    url = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/usd.xml"
    
    # Configure year range here
    START_YEAR = 2025
    END_YEAR = 2026
    
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, xml_file)
    except Exception as e:
        print(f"Error downloading file: {e}")
    
    if os.path.exists(xml_file):
        count = convert_xml_to_js(xml_file, output_file, START_YEAR, END_YEAR)
        print(f"Successfully converted {count} rates for {START_YEAR}-{END_YEAR} to {output_file}")
    else:
        print(f"Error: {xml_file} not found")
