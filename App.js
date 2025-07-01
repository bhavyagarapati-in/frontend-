import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [data, setData] = useState({});
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState('');
  const [savedCities, setSavedCities] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');

  const API_KEY = '27bad8363ddda38a5d52da4072d2adc1';

  const fetchWeatherData = useCallback(async (city) => {
    try {
      setIsLoading(true);
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
      const response = await axios.get(currentWeatherUrl);

      setData(response.data);
      setErrorMessage('');
      localStorage.setItem('lastCity', city);

      const condition = response.data.weather[0].main.toLowerCase();
      setBackgroundImage(`https://source.unsplash.com/1600x900/?${condition},weather`);

      fetchForecastData(city);
    } catch (error) {
      setIsLoading(false);
      if (error.response?.status === 404) {
        setErrorMessage("City not found. It may be a small village or misspelled.");
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
      }
      setData({});
      setForecast([]);
    }
  }, []); // Empty dependency array for fetchWeatherData since it's stable

  const fetchForecastData = async (city) => {
    try {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
      const response = await axios.get(forecastUrl);

      const dailyForecasts = [];
      const dates = {};

      response.data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dates[date] && Object.keys(dates).length < 5) {
          dates[date] = true;
          dailyForecasts.push(item);
        }
      });

      setForecast(dailyForecasts);
    } catch (error) {
      console.error("Forecast API error:", error);
      setForecast([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedCitiesList = JSON.parse(localStorage.getItem('savedCities')) || [];
    setSavedCities(savedCitiesList);

    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
      fetchWeatherData(lastCity);
    }

    setBackgroundImage('https://source.unsplash.com/1600x900/?nature,sky');

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setLocation('');
        setErrorMessage('');
      }
    };
    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [fetchWeatherData]); // Add fetchWeatherData as a dependency

  const searchLocation = (event) => {
    if (event.key === "Enter" && location.trim()) {
      fetchWeatherData(location);
      setLocation('');
    }
  };

  const saveCity = () => {
    if (data.name && !savedCities.includes(data.name)) {
      const updatedCities = [...savedCities, data.name];
      setSavedCities(updatedCities);
      localStorage.setItem('savedCities', JSON.stringify(updatedCities));
    }
  };

  const removeCity = (city) => {
    const updatedCities = savedCities.filter(c => c !== city);
    setSavedCities(updatedCities);
    localStorage.setItem('savedCities', JSON.stringify(updatedCities));
  };

  const formatDate = (dt_txt) => {
    const date = new Date(dt_txt);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="app" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="overlay">
        <div className="content">
          <div className="search-container">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={searchLocation}
              placeholder='Enter Location'
              type="text"
              className="search-input"
            />
          </div>

          {isLoading && (
            <div className="card loading-card">
              <div className="loader"></div>
              <p>Loading weather data...</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="card error-card">
              <p className="error-message">{errorMessage}</p>
            </div>
          )}

          {data.name && !isLoading && (
            <div className="card weather-card">
              <div className="weather-header">
                <div className="location-info">
                  <h2>{data.name}, {data.sys?.country}</h2>
                  <p className="date-info">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button 
                  className="save-button"
                  onClick={saveCity}
                  disabled={savedCities.includes(data.name)}
                >
                  {savedCities.includes(data.name) ? '★ Saved' : '☆ Save City'}
                </button>
              </div>

              <div className="weather-body">
                <div className="temperature-container">
                  {data.main && <h1 className="temperature">{data.main.temp.toFixed()}°C</h1>}
                  {data.weather && (
                    <div className="weather-description">
                      <p>{data.weather[0].description}</p>
                      <img 
                        src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`} 
                        alt={data.weather[0].description}
                        className="weather-icon"
                      />
                    </div>
                  )}
                </div>

                <div className="weather-details">
                  <div className="detail-item">
                    <span className="detail-label">Feels Like</span>
                    <span className="detail-value">{data.main.feels_like.toFixed()}°C</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Humidity</span>
                    <span className="detail-value">{data.main.humidity}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Wind Speed</span>
                    <span className="detail-value">{data.wind.speed.toFixed()} MPH</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Min Temp</span>
                    <span className="detail-value">{data.main.temp_min.toFixed()}°C</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Max Temp</span>
                    <span className="detail-value">{data.main.temp_max.toFixed()}°C</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {forecast.length > 0 && !isLoading && (
            <div className="card forecast-card">
              <h2 className="section-title">5-Day Forecast</h2>
              <div className="forecast-container">
                {forecast.map((day, index) => (
                  <div key={index} className="forecast-day">
                    <h3 className="forecast-date">{formatDate(day.dt_txt)}</h3>
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt={day.weather[0].description}
                      className="forecast-icon"
                    />
                    <p className="forecast-temp">{day.main.temp.toFixed()}°C</p>
                    <p className="forecast-desc">{day.weather[0].description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedCities.length > 0 && (
            <div className="card saved-cities-card">
              <h2 className="section-title">Saved Cities</h2>
              <div className="saved-cities-list">
                {savedCities.map((city, index) => (
                  <div key={index} className="saved-city-item">
                    <button className="city-button" onClick={() => fetchWeatherData(city)}>{city}</button>
                    <button className="remove-button" onClick={() => removeCity(city)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
