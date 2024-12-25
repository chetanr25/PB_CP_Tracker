from flask import Flask, request
# from requests_html import HTMLSession
from bs4 import BeautifulSoup
import requests
import math
import time
app = Flask(__name__)

# This is currently returning a 403 status code.
@app.route("/codeforces")
def codeforces():
    username = request.args.get("username")
    url = f"https://codeforces.com/profile/{username}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }

    r = requests.get(url, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')
    rating = soup.find_all('span', class_='user-gray')[1].text
    return rating

@app.route("/leetcode")
def leetcode():
    username = request.args.get("username")
    url = "https://leetcode.com/graphql"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }

    query = f"""
    query {{
        userContestRanking(username: "{username}") {{
            rating
        }}
    }}
    """

    try:
        r = requests.post(url, json={"query": query}, headers=headers).json()
        rating = r['data']['userContestRanking']['rating']
        return str(math.ceil(rating))
    except:
        return "unrated"
    
if __name__ == "__main__":
    app.run(debug=True)