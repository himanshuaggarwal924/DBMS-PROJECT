CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_expiry DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
  city_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  country VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,8) DEFAULT NULL,
  longitude DECIMAL(11,8) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO categories (category_id, name) VALUES
  (1, 'Hotel'),
  (2, 'Restaurant'),
  (3, 'Attraction');

CREATE TABLE IF NOT EXISTS places (
  place_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avg_cost DECIMAL(10,2) DEFAULT NULL,
  rating DECIMAL(2,1) DEFAULT NULL CHECK (rating >= 0 AND rating <= 5),
  latitude DECIMAL(10,8) DEFAULT NULL,
  longitude DECIMAL(11,8) DEFAULT NULL,
  city_id INT NOT NULL,
  category_id INT NOT NULL,
  api_place_id VARCHAR(120) NOT NULL UNIQUE,
  google_place_id VARCHAR(120) DEFAULT NULL,
  popularity_score INT NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trips (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  city_id INT NOT NULL,
  planned_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trip_places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  place_id INT NOT NULL,
  day_number INT NOT NULL,
  visit_order INT NOT NULL,
  planned_cost DECIMAL(10,2) DEFAULT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
  UNIQUE KEY unique_trip_day_visit (trip_id, day_number, visit_order),
  UNIQUE KEY unique_trip_place_day (trip_id, place_id, day_number)
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  place_id INT NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_place (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  place_id INT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_place_review (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS user_searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  city_id INT NOT NULL,
  search_params JSON DEFAULT NULL,
  searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE CASCADE,
  INDEX idx_user_searches_searched_at (searched_at)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  place_id INT DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category ENUM('food', 'travel', 'shopping', 'tickets', 'other') NOT NULL,
  spent_date DATE NOT NULL,
  note TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE SET NULL
);

CREATE INDEX idx_places_city_category ON places(city_id, category_id);
CREATE INDEX idx_places_rating ON places(rating);
CREATE INDEX idx_places_avg_cost ON places(avg_cost);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trip_places_trip_day ON trip_places(trip_id, day_number, visit_order);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_reviews_place_id ON reviews(place_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
