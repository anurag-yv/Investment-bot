from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import time
import requests
import os

app = Flask(__name__, static_folder='static')
CORS(app)

STOCKS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"]
ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "demo")  # Replace "demo" with your key or set in env

def fetch_mock_stock_data(symbol):
    dates = ["2025-04-01", "2025-04-02", "2025-04-03"]
    prices = [round(random.uniform(100, 300), 2) for _ in dates]
    change = round(random.uniform(-5, 5), 2)
    volatility = "low" if abs(change) < 2 else "medium" if abs(change) < 4 else "high"

    return {
        "symbol": symbol,
        "price": prices[-1],
        "change": change,
        "trend": {"dates": dates, "prices": prices},
        "volatility": volatility
    }

def fetch_real_stock_data(symbol):
    try:
        url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if "Time Series (Daily)" not in data:
            raise ValueError("Invalid API response")

        time_series = data["Time Series (Daily)"]
        sorted_dates = sorted(time_series.keys(), reverse=True)
        dates = sorted_dates[:3]
        prices = [float(time_series[d]["4. close"]) for d in dates]
        change = round(prices[0] - prices[1], 2)
        volatility = "low" if abs(change) < 2 else "medium" if abs(change) < 4 else "high"

        return {
            "symbol": symbol,
            "price": round(prices[0], 2),
            "change": change,
            "trend": {"dates": dates[::-1], "prices": prices[::-1]},
            "volatility": volatility
        }

    except Exception as e:
        print(f"[ERROR] Real API failed for {symbol}: {str(e)}")
        return fetch_mock_stock_data(symbol)

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route("/api/trending")
def get_trending():
    trending = []
    for symbol in STOCKS[:3]:  # Top 3 trending
        stock = fetch_real_stock_data(symbol)
        trending.append(stock)
        time.sleep(1)  # optional realism

    return jsonify({"trending": trending})

@app.route("/api/investments", methods=["POST"])
def get_investment_suggestions():
    try:
        data = request.get_json()
        target_amount = float(data.get("target_amount", 10000))
        risk_tolerance = data.get("risk_tolerance", "medium")
        horizon = int(data.get("horizon", 5))

        suggestions = []

        for symbol in STOCKS:
            stock_data = fetch_real_stock_data(symbol)
            if (
                (risk_tolerance == "low" and stock_data["volatility"] == "low") or
                (risk_tolerance == "medium" and stock_data["volatility"] in ["low", "medium"]) or
                (risk_tolerance == "high")
            ):
                allocation = target_amount * random.uniform(0.1, 0.4) / stock_data["price"]
                suggestions.append({
                    "symbol": stock_data["symbol"],
                    "price": stock_data["price"],
                    "suggested_shares": round(allocation, 2),
                    "volatility": stock_data["volatility"],
                    "expected_return": round(random.uniform(2, 10), 2)
                })

        if not suggestions:
            return jsonify({"status": "error", "message": "No suitable investments found for your criteria."}), 404

        return jsonify({
            "status": "success",
            "suggestions": suggestions[:3],
            "message": f"Optimized for ${target_amount:,} over {horizon} years with {risk_tolerance} risk."
        })

    except Exception as e:
        print(f"[ERROR] Investment Suggestion Error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal server error. Please try again."}), 500

@app.route("/api/stock/<symbol>")
def get_stock_details(symbol):
    stock_data = fetch_real_stock_data(symbol.upper())
    return jsonify(stock_data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
