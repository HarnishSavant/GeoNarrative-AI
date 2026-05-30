import httpx
from app.core.config import settings

class WeatherService:
    @staticmethod
    def _assess_flood_impact(humidity: int, rain_1h: float, wind_speed: float) -> dict:
        risk_score = 0
        factors = []

        if humidity > 80:
            risk_score += 3
            factors.append("High humidity (>80%) — saturated soil conditions")
        elif humidity > 60:
            risk_score += 1
            factors.append("Moderate humidity — normal moisture levels")

        if rain_1h > 20:
            risk_score += 4
            factors.append(f"Heavy rainfall ({rain_1h}mm/h) — flash flood risk")
        elif rain_1h > 5:
            risk_score += 2
            factors.append(f"Moderate rainfall ({rain_1h}mm/h) — monitor drainage")
        elif rain_1h > 0:
            risk_score += 1
            factors.append(f"Light rainfall ({rain_1h}mm/h) — minimal impact")

        if wind_speed > 15:
            risk_score += 2
            factors.append(f"Strong winds ({wind_speed}m/s) — storm conditions")

        level = "critical" if risk_score > 7 else "high" if risk_score > 5 else "medium" if risk_score > 2 else "low"

        return {
            "risk_level": level,
            "risk_score": min(risk_score, 10),
            "factors": factors,
            "advisory": (
                "⚠️ Flood warning — take immediate precautions" if level in ["critical", "high"]
                else "🟡 Monitor weather conditions" if level == "medium"
                else "🟢 Normal conditions — no immediate flood risk"
            ),
        }

    @staticmethod
    def get_mock_weather(location: str) -> dict:
        return {
            "current": {
                "temp": 32.5,
                "feels_like": 36.2,
                "humidity": 65,
                "pressure": 1008,
                "wind_speed": 4.2,
                "weather": "partly cloudy",
                "rain_1h": 0,
            },
            "forecast": [
                {"date": "2025-05-24", "temp_min": 26, "temp_max": 34, "weather": "scattered clouds", "rain": 0},
                {"date": "2025-05-25", "temp_min": 25, "temp_max": 33, "weather": "light rain", "rain": 5.2},
                {"date": "2025-05-26", "temp_min": 24, "temp_max": 31, "weather": "moderate rain", "rain": 12.8},
            ],
        }

    @classmethod
    async def get_live_weather(cls, lat: float, lon: float, location: str) -> dict:
        api_key = settings.WEATHER_API_KEY
        if not api_key:
            return {
                "location": location,
                "error": "Weather API key not configured",
                "data": cls.get_mock_weather(location),
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Current weather
                current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
                current_resp = await client.get(current_url)
                current_data = current_resp.json()

                # 5-day forecast
                forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
                forecast_resp = await client.get(forecast_url)
                forecast_data = forecast_resp.json()

            if current_resp.status_code != 200:
                return {
                    "location": location,
                    "error": current_data.get("message", "Weather API error"),
                    "data": cls.get_mock_weather(location),
                }

            # Process forecast into daily summaries
            daily_forecast = []
            seen_dates = set()
            for item in forecast_data.get("list", [])[:40]:
                date = item["dt_txt"].split(" ")[0]
                if date not in seen_dates and len(daily_forecast) < 5:
                    seen_dates.add(date)
                    daily_forecast.append({
                        "date": date,
                        "temp_min": round(item["main"]["temp_min"], 1),
                        "temp_max": round(item["main"]["temp_max"], 1),
                        "humidity": item["main"]["humidity"],
                        "weather": item["weather"][0]["description"],
                        "icon": item["weather"][0]["icon"],
                        "rain": item.get("rain", {}).get("3h", 0),
                        "wind_speed": round(item["wind"]["speed"], 1),
                    })

            return {
                "location": location,
                "current": {
                    "temp": round(current_data["main"]["temp"], 1),
                    "feels_like": round(current_data["main"]["feels_like"], 1),
                    "humidity": current_data["main"]["humidity"],
                    "pressure": current_data["main"]["pressure"],
                    "wind_speed": round(current_data["wind"]["speed"], 1),
                    "wind_dir": current_data["wind"].get("deg", 0),
                    "visibility": current_data.get("visibility", 10000),
                    "clouds": current_data["clouds"]["all"],
                    "weather": current_data["weather"][0]["description"],
                    "icon": current_data["weather"][0]["icon"],
                    "rain_1h": current_data.get("rain", {}).get("1h", 0),
                },
                "forecast": daily_forecast,
                "flood_impact": cls._assess_flood_impact(
                    current_data["main"]["humidity"],
                    current_data.get("rain", {}).get("1h", 0),
                    current_data["wind"]["speed"],
                ),
            }
        except Exception as e:
            return {
                "location": location,
                "error": str(e),
                "data": cls.get_mock_weather(location),
            }
