# Android App Development Guide - Heal Lots Mobile

Complete step-by-step guide to build an Android mobile app that mirrors the React frontend and connects to the heal-lots-api backend.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Architecture Overview](#architecture-overview)
4. [API Integration](#api-integration)
5. [Feature Implementation](#feature-implementation)
6. [UI/UX Design](#uiux-design)
7. [Testing & Deployment](#testing--deployment)

---

## Prerequisites

### Required Software
- **Android Studio** (Latest version - Giraffe or later)
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** with API level 24+ (minimum)
- **Git** (for version control)
- **Postman** or **Insomnia** (for API testing)

### Knowledge Requirements
- Java/Kotlin programming
- Android development fundamentals
- REST API consumption
- JSON serialization/deserialization

### Backend Verification
- Ensure heal-lots-api is running on `http://localhost:8080`
- Test API endpoints with Postman before building the app

---

## Project Setup

### Step 1: Create a New Android Project

1. **Open Android Studio** and click "New Project"
2. **Select "Empty Activity"** template
3. **Configure Project Settings**:
   - Name: `Heal Lots Mobile` (or `HealLotsAndroid`)
   - Package Name: `com.heallots.mobile`
   - Save Location: Your preferred directory
   - Language: **Java** (or Kotlin if preferred)
   - Minimum SDK: **API 24 (Android 7.0)**
   - Target SDK: **API 34 (Android 14)**

### Step 2: Update build.gradle Dependencies

In `build.gradle` (Module: app), add the following dependencies:

```gradle
dependencies {
    // Core Android
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.cardview:cardview:1.0.0'
    implementation 'androidx.recyclerview:recyclerview:1.3.0'

    // HTTP & JSON
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.10.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.10.0'

    // JSON Parsing
    implementation 'com.google.code.gson:gson:2.8.9'

    // Image Loading
    implementation 'com.squareup.picasso:picasso:2.8'

    // Material Design
    implementation 'com.google.android.material:material:1.9.0'

    // SharedPreferences (for token storage)
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'

    // Lifecycle & LiveData
    implementation 'androidx.lifecycle:lifecycle-viewmodel:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-livedata:2.6.1'

    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

### Step 3: Update AndroidManifest.xml

Add permissions and update the manifest:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Internet Permission -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Camera & Storage for Profile Pictures -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HealLots"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

### Step 4: Project Folder Structure

Create this folder structure in `app/src/main/java/com/heallots/mobile/`:

```
com/heallots/mobile/
├── api/
│   ├── ApiClient.java
│   ├── ApiService.java
│   └── RequestInterceptor.java
├── models/
│   ├── User.java
│   ├── Appointment.java
│   ├── Review.java
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   ├── RegisterRequest.java
│   └── BookAppointmentRequest.java
├── ui/
│   ├── activities/
│   │   ├── MainActivity.java
│   │   ├── LoginActivity.java
│   │   ├── RegisterActivity.java
│   │   ├── DashboardActivity.java
│   │   ├── BookAppointmentActivity.java
│   │   ├── MyAppointmentsActivity.java
│   │   ├── ProfileActivity.java
│   │   └── AdminDashboardActivity.java
│   ├── adapters/
│   │   ├── AppointmentAdapter.java
│   │   ├── SpecialistAdapter.java
│   │   └── ReviewAdapter.java
│   └── fragments/
│       ├── UpcomingFragment.java
│       ├── PastFragment.java
│       └── CancelledFragment.java
├── storage/
│   └── TokenManager.java
├── utils/
│   ├── Constants.java
│   ├── DateUtils.java
│   └── ValidationUtils.java
└── MainActivity.java
```

---

## Architecture Overview

### MVC Pattern with Retrofit

```
┌─────────────────────────────────────────────┐
│         Android App (UI Layer)              │
│  Activities/Fragments + Layout XMLs         │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│      Business Logic & Data Layer            │
│  Adapters, ViewModels, TokenManager         │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│        Network Layer (Retrofit)             │
│  ApiService + ApiClient + Interceptor       │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│    Backend API (heal-lots-api)              │
│  http://localhost:8080/api/*                │
└─────────────────────────────────────────────┘
```

---

## API Integration

### Step 1: Create Model Classes

#### 1.1 User.java
```java
package com.heallots.mobile.models;

public class User {
    private String id;
    private String email;
    private String fullName;
    private String role;
    private String phoneNumber;
    private String profilePictureUrl;
    private String createdAt;

    public User() {}

    public User(String email, String fullName, String role) {
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
```

#### 1.2 LoginRequest.java
```java
package com.heallots.mobile.models;

public class LoginRequest {
    private String email;
    private String password;

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

#### 1.3 LoginResponse.java
```java
package com.heallots.mobile.models;

public class LoginResponse {
    private String message;
    private String token;
    private User user;

    public LoginResponse() {}

    // Getters and Setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
```

#### 1.4 Appointment.java
```java
package com.heallots.mobile.models;

public class Appointment {
    private String id;
    private String serviceName;
    private String specialistName;
    private String appointmentDate;
    private String timeSlot;
    private String reason;
    private String notes;
    private String status;
    private String rescheduleReason;
    private String cancellationReason;
    private String createdAt;
    private String updatedAt;
    private boolean reviewed;

    public Appointment() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRescheduleReason() { return rescheduleReason; }
    public void setRescheduleReason(String rescheduleReason) { this.rescheduleReason = rescheduleReason; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean reviewed) { this.reviewed = reviewed; }
}
```

#### 1.5 BookAppointmentRequest.java
```java
package com.heallots.mobile.models;

public class BookAppointmentRequest {
    private String serviceName;
    private String specialistName;
    private String appointmentDate;
    private String timeSlot;
    private String reason;
    private String notes;

    public BookAppointmentRequest() {}

    public BookAppointmentRequest(String serviceName, String specialistName, String appointmentDate, String timeSlot, String reason, String notes) {
        this.serviceName = serviceName;
        this.specialistName = specialistName;
        this.appointmentDate = appointmentDate;
        this.timeSlot = timeSlot;
        this.reason = reason;
        this.notes = notes;
    }

    // Getters and Setters
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
```

#### 1.6 Review.java
```java
package com.heallots.mobile.models;

public class Review {
    private String id;
    private String appointmentId;
    private String specialistName;
    private String serviceName;
    private int rating;
    private String reviewText;
    private String patientName;
    private String patientEmail;
    private String createdAt;

    public Review() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getReviewText() { return reviewText; }
    public void setReviewText(String reviewText) { this.reviewText = reviewText; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
```

### Step 2: Create Network Layer

#### 2.1 Constants.java
```java
package com.heallots.mobile.utils;

public class Constants {
    // Change this to your backend URL (use 10.0.2.2 for Android emulator)
    public static final String BASE_URL = "http://10.0.2.2:8080"; // Emulator uses 10.0.2.2 instead of localhost
    // For physical device, change to your machine's IP: http://192.168.x.x:8080
    
    // API Endpoints
    public static final String AUTH_REGISTER = "/api/auth/register";
    public static final String AUTH_LOGIN = "/api/auth/login";
    public static final String APPOINTMENTS_BOOK = "/api/appointments/book";
    public static final String APPOINTMENTS_ALL = "/api/appointments/all";
    public static final String APPOINTMENTS_USER = "/api/appointments/user";
    public static final String APPOINTMENTS_UPDATE_STATUS = "/api/appointments/{id}/status";
    public static final String APPOINTMENTS_UPDATE = "/api/appointments/{id}";
    public static final String REVIEWS_SUBMIT = "/api/reviews";
    public static final String REVIEWS_SPECIALIST_RATINGS = "/api/reviews/specialist-ratings";
    public static final String REVIEWS_CHECK_APPOINTMENT = "/api/reviews/appointment/{appointmentId}/reviewed";
    public static final String USER_PROFILE = "/api/user/profile";
    public static final String USER_CHANGE_PASSWORD = "/api/user/change-password";
    public static final String USER_UPLOAD_PROFILE_PIC = "/api/user/upload-profile-picture";
    public static final String USER_PROFILE_PICTURE = "/api/user/profile-picture/{filename}";
}
```

#### 2.2 ApiService.java
```java
package com.heallots.mobile.api;

import com.heallots.mobile.models.*;
import retrofit2.Call;
import retrofit2.http.*;
import java.util.Map;

public interface ApiService {
    
    // ============ Authentication ============
    @POST("/api/auth/register")
    Call<LoginResponse> register(@Body RegisterRequest request);

    @POST("/api/auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    // ============ Appointments ============
    @POST("/api/appointments/book")
    Call<Appointment> bookAppointment(@Header("Authorization") String token, @Body BookAppointmentRequest request);

    @GET("/api/appointments/all")
    Call<java.util.List<Appointment>> getAllAppointments(@Header("Authorization") String token);

    @GET("/api/appointments/user")
    Call<java.util.List<Appointment>> getUserAppointments(@Header("Authorization") String token);

    @PUT("/api/appointments/{id}/status")
    Call<Appointment> updateAppointmentStatus(
        @Header("Authorization") String token,
        @Path("id") String appointmentId,
        @Body Map<String, String> request
    );

    @PUT("/api/appointments/{id}")
    Call<Appointment> updateAppointment(
        @Header("Authorization") String token,
        @Path("id") String appointmentId,
        @Body Map<String, String> request
    );

    // ============ Reviews ============
    @POST("/api/reviews")
    Call<Map<String, String>> submitReview(@Header("Authorization") String token, @Body Review review);

    @GET("/api/reviews/specialist-ratings")
    Call<Map<String, SpecialistRating>> getSpecialistRatings(@Header("Authorization") String token);

    @GET("/api/reviews/appointment/{appointmentId}/reviewed")
    Call<Map<String, Boolean>> checkAppointmentReviewed(
        @Header("Authorization") String token,
        @Path("appointmentId") String appointmentId
    );

    // ============ User Profile ============
    @PUT("/api/user/profile")
    Call<Map<String, String>> updateProfile(@Header("Authorization") String token, @Body User user);

    @POST("/api/user/change-password")
    Call<Map<String, String>> changePassword(@Header("Authorization") String token, @Body Map<String, String> request);

    @Multipart
    @POST("/api/user/upload-profile-picture")
    Call<Map<String, String>> uploadProfilePicture(
        @Header("Authorization") String token,
        @Part("file") okhttp3.RequestBody file
    );
}

// Model class for specialist ratings
class SpecialistRating {
    public double rating;
    public int reviews;
}
```

#### 2.3 RequestInterceptor.java
```java
package com.heallots.mobile.api;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;
import java.io.IOException;

public class RequestInterceptor implements Interceptor {
    @Override
    public Response intercept(Chain chain) throws IOException {
        Request originalRequest = chain.request();
        
        // Add logging if needed
        Request request = originalRequest.newBuilder()
            .header("Content-Type", "application/json")
            .build();
        
        return chain.proceed(request);
    }
}
```

#### 2.4 ApiClient.java
```java
package com.heallots.mobile.api;

import com.heallots.mobile.utils.Constants;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static Retrofit retrofit = null;

    public static Retrofit getClient() {
        if (retrofit == null) {
            // Set up logging for debugging
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient httpClient = new OkHttpClient.Builder()
                .addInterceptor(logging)
                .addInterceptor(new RequestInterceptor())
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();

            retrofit = new Retrofit.Builder()
                .baseUrl(Constants.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .client(httpClient)
                .build();
        }

        return retrofit;
    }

    public static ApiService getApiService() {
        return getClient().create(ApiService.class);
    }
}
```

### Step 3: Create Token Storage

#### 3.1 TokenManager.java
```java
package com.heallots.mobile.storage;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;
import com.heallots.mobile.models.User;
import com.google.gson.Gson;

public class TokenManager {
    private static final String PREFS_NAME = "HealLotsPrefs";
    private static final String TOKEN_KEY = "token";
    private static final String USER_KEY = "user";
    
    private SharedPreferences sharedPreferences;
    private Gson gson;

    public TokenManager(Context context) {
        try {
            String masterKey = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC);
            this.sharedPreferences = EncryptedSharedPreferences.create(
                PREFS_NAME,
                masterKey,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            // Fallback to regular SharedPreferences if encryption fails
            this.sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        }
        this.gson = new Gson();
    }

    public void saveToken(String token) {
        sharedPreferences.edit().putString(TOKEN_KEY, token).apply();
    }

    public String getToken() {
        return sharedPreferences.getString(TOKEN_KEY, null);
    }

    public void saveUser(User user) {
        String userJson = gson.toJson(user);
        sharedPreferences.edit().putString(USER_KEY, userJson).apply();
    }

    public User getUser() {
        String userJson = sharedPreferences.getString(USER_KEY, null);
        if (userJson != null) {
            return gson.fromJson(userJson, User.class);
        }
        return null;
    }

    public boolean isLoggedIn() {
        return getToken() != null;
    }

    public void logout() {
        sharedPreferences.edit().clear().apply();
    }

    public String getAuthorizationHeader() {
        String token = getToken();
        if (token != null) {
            return "Bearer " + token;
        }
        return null;
    }
}
```

---

## Feature Implementation

### Step 1: Authentication Activities

#### 1.1 LoginActivity.java
```java
package com.heallots.mobile.ui.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.heallots.mobile.R;
import com.heallots.mobile.api.ApiClient;
import com.heallots.mobile.api.ApiService;
import com.heallots.mobile.models.LoginRequest;
import com.heallots.mobile.models.LoginResponse;
import com.heallots.mobile.storage.TokenManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {
    private EditText emailEditText, passwordEditText;
    private Button loginButton;
    private TextView registerLink;
    private ApiService apiService;
    private TokenManager tokenManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        apiService = ApiClient.getApiService();
        tokenManager = new TokenManager(this);

        // Initialize views
        emailEditText = findViewById(R.id.emailEditText);
        passwordEditText = findViewById(R.id.passwordEditText);
        loginButton = findViewById(R.id.loginButton);
        registerLink = findViewById(R.id.registerLink);

        loginButton.setOnClickListener(v -> handleLogin());
        registerLink.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
            finish();
        });
    }

    private void handleLogin() {
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();

        if (!validateInputs(email, password)) {
            return;
        }

        loginButton.setEnabled(false);
        loginButton.setText("Logging in...");

        LoginRequest request = new LoginRequest(email, password);
        apiService.login(request).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse loginResponse = response.body();
                    tokenManager.saveToken(loginResponse.getToken());
                    tokenManager.saveUser(loginResponse.getUser());

                    Toast.makeText(LoginActivity.this, "Login successful", Toast.LENGTH_SHORT).show();

                    // Navigate to dashboard based on role
                    Intent intent = loginResponse.getUser().getRole().equals("ADMIN")
                        ? new Intent(LoginActivity.this, AdminDashboardActivity.class)
                        : new Intent(LoginActivity.this, DashboardActivity.class);
                    startActivity(intent);
                    finish();
                } else {
                    Toast.makeText(LoginActivity.this, "Login failed: Invalid credentials", Toast.LENGTH_SHORT).show();
                }
                loginButton.setEnabled(true);
                loginButton.setText("Login");
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                loginButton.setEnabled(true);
                loginButton.setText("Login");
            }
        });
    }

    private boolean validateInputs(String email, String password) {
        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Invalid email format", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (password.length() < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }
}
```

#### 1.2 RegisterActivity.java
```java
package com.heallots.mobile.ui.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.heallots.mobile.R;
import com.heallots.mobile.api.ApiClient;
import com.heallots.mobile.api.ApiService;
import com.heallots.mobile.models.LoginResponse;
import com.heallots.mobile.storage.TokenManager;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {
    private EditText nameEditText, emailEditText, passwordEditText, confirmPasswordEditText;
    private Button registerButton;
    private TextView loginLink;
    private ApiService apiService;
    private TokenManager tokenManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        apiService = ApiClient.getApiService();
        tokenManager = new TokenManager(this);

        // Initialize views
        nameEditText = findViewById(R.id.nameEditText);
        emailEditText = findViewById(R.id.emailEditText);
        passwordEditText = findViewById(R.id.passwordEditText);
        confirmPasswordEditText = findViewById(R.id.confirmPasswordEditText);
        registerButton = findViewById(R.id.registerButton);
        loginLink = findViewById(R.id.loginLink);

        registerButton.setOnClickListener(v -> handleRegister());
        loginLink.setOnClickListener(v -> {
            startActivity(new Intent(RegisterActivity.this, LoginActivity.class));
            finish();
        });
    }

    private void handleRegister() {
        String name = nameEditText.getText().toString().trim();
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();
        String confirmPassword = confirmPasswordEditText.getText().toString().trim();

        if (!validateInputs(name, email, password, confirmPassword)) {
            return;
        }

        registerButton.setEnabled(false);
        registerButton.setText("Creating Account...");

        Map<String, String> request = new HashMap<>();
        request.put("fullName", name);
        request.put("email", email);
        request.put("password", password);

        apiService.register(null).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse registerResponse = response.body();
                    tokenManager.saveToken(registerResponse.getToken());
                    tokenManager.saveUser(registerResponse.getUser());

                    Toast.makeText(RegisterActivity.this, "Registration successful", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(RegisterActivity.this, DashboardActivity.class));
                    finish();
                } else {
                    Toast.makeText(RegisterActivity.this, "Registration failed", Toast.LENGTH_SHORT).show();
                }
                registerButton.setEnabled(true);
                registerButton.setText("Create Account");
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                registerButton.setEnabled(true);
                registerButton.setText("Create Account");
            }
        });
    }

    private boolean validateInputs(String name, String email, String password, String confirmPassword) {
        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Invalid email format", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (password.length() < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (!password.equals(confirmPassword)) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }
}
```

### Step 2: Main Activities

#### 2.1 MainActivity.java (Splash/Entry Point)
```java
package com.heallots.mobile.ui.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import androidx.appcompat.app.AppCompatActivity;
import com.heallots.mobile.R;
import com.heallots.mobile.storage.TokenManager;

public class MainActivity extends AppCompatActivity {
    private TokenManager tokenManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        tokenManager = new TokenManager(this);

        new Handler().postDelayed(() -> {
            if (tokenManager.isLoggedIn()) {
                // User is logged in, navigate to dashboard
                startActivity(new Intent(MainActivity.this, DashboardActivity.class));
            } else {
                // User is not logged in, navigate to login
                startActivity(new Intent(MainActivity.this, LoginActivity.class));
            }
            finish();
        }, 2000); // 2 second splash screen
    }
}
```

#### 2.2 DashboardActivity.java (User Dashboard)
```java
package com.heallots.mobile.ui.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.heallots.mobile.R;
import com.heallots.mobile.api.ApiClient;
import com.heallots.mobile.api.ApiService;
import com.heallots.mobile.models.Appointment;
import com.heallots.mobile.storage.TokenManager;
import com.squareup.picasso.Picasso;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {
    private TokenManager tokenManager;
    private ApiService apiService;
    private Button bookButton, myAppointmentsButton, profileButton, logoutButton;
    private TextView userNameText, upcomingAppointmentText;
    private ImageView profileImage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        tokenManager = new TokenManager(this);
        apiService = ApiClient.getApiService();

        // Initialize views
        bookButton = findViewById(R.id.bookButton);
        myAppointmentsButton = findViewById(R.id.myAppointmentsButton);
        profileButton = findViewById(R.id.profileButton);
        logoutButton = findViewById(R.id.logoutButton);
        userNameText = findViewById(R.id.userNameText);
        upcomingAppointmentText = findViewById(R.id.upcomingAppointmentText);
        profileImage = findViewById(R.id.profileImage);

        // Set user info
        String userName = tokenManager.getUser().getFullName();
        userNameText.setText("Welcome, " + userName);

        // Load user profile picture if available
        String profileUrl = tokenManager.getUser().getProfilePictureUrl();
        if (profileUrl != null && !profileUrl.isEmpty()) {
            Picasso.get().load(profileUrl).into(profileImage);
        }

        // Fetch upcoming appointments
        fetchUpcomingAppointments();

        // Button click listeners
        bookButton.setOnClickListener(v -> startActivity(new Intent(DashboardActivity.this, BookAppointmentActivity.class)));
        myAppointmentsButton.setOnClickListener(v -> startActivity(new Intent(DashboardActivity.this, MyAppointmentsActivity.class)));
        profileButton.setOnClickListener(v -> startActivity(new Intent(DashboardActivity.this, ProfileActivity.class)));
        logoutButton.setOnClickListener(v -> handleLogout());
    }

    private void fetchUpcomingAppointments() {
        String token = tokenManager.getAuthorizationHeader();
        apiService.getUserAppointments(token).enqueue(new Callback<List<Appointment>>() {
            @Override
            public void onResponse(Call<List<Appointment>> call, Response<List<Appointment>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Appointment> appointments = response.body();
                    if (appointments.size() > 0) {
                        Appointment upcomingAppt = appointments.get(0);
                        upcomingAppointmentText.setText("Next: " + upcomingAppt.getSpecialistName() + 
                            " - " + upcomingAppt.getAppointmentDate());
                    } else {
                        upcomingAppointmentText.setText("No upcoming appointments");
                    }
                }
            }

            @Override
            public void onFailure(Call<List<Appointment>> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Error fetching appointments", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void handleLogout() {
        tokenManager.logout();
        startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
        finish();
    }
}
```

---

## UI/UX Design

### Layout Files (XML)

#### activity_login.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center"
    android:background="#fafaf8">

    <!-- Logo -->
    <ImageView
        android:id="@+id/logoImage"
        android:layout_width="120dp"
        android:layout_height="120dp"
        android:src="@mipmap/ic_launcher"
        android:contentDescription="App Logo"
        android:layout_marginBottom="32dp" />

    <!-- Title -->
    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Welcome Back"
        android:textSize="28sp"
        android:textStyle="bold"
        android:textColor="#1c1408"
        android:gravity="center"
        android:layout_marginBottom="8dp" />

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Log in to your account"
        android:textSize="14sp"
        android:textColor="#a8956b"
        android:gravity="center"
        android:layout_marginBottom="32dp" />

    <!-- Email -->
    <EditText
        android:id="@+id/emailEditText"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:hint="Email"
        android:inputType="textEmailAddress"
        android:padding="12dp"
        android:background="@drawable/edit_text_background"
        android:textColor="#1c1408"
        android:textColorHint="#a8956b"
        android:layout_marginBottom="16dp" />

    <!-- Password -->
    <EditText
        android:id="@+id/passwordEditText"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:hint="Password"
        android:inputType="textPassword"
        android:padding="12dp"
        android:background="@drawable/edit_text_background"
        android:textColor="#1c1408"
        android:textColorHint="#a8956b"
        android:layout_marginBottom="24dp" />

    <!-- Login Button -->
    <Button
        android:id="@+id/loginButton"
        android:layout_width="match_parent"
        android:layout_height="48dp"
        android:text="Login"
        android:textSize="16sp"
        android:textStyle="bold"
        android:textColor="#fff"
        android:background="@drawable/button_background"
        android:layout_marginBottom="16dp" />

    <!-- Register Link -->
    <TextView
        android:id="@+id/registerLink"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Don't have an account? Register here"
        android:textSize="14sp"
        android:textColor="#d97706"
        android:gravity="center"
        android:paddingTop="8dp" />

</LinearLayout>
```

#### activity_dashboard.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#fafaf8">

    <!-- Top Bar -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="64dp"
        android:background="@drawable/top_bar_background"
        android:gravity="center_vertical"
        android:paddingHorizontal="16dp"
        android:orientation="horizontal">

        <ImageView
            android:id="@+id/logoTopBar"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:src="@mipmap/ic_launcher"
            android:contentDescription="Logo" />

        <View android:layout_width="0dp" android:layout_height="1dp" android:layout_weight="1" />

        <Button
            android:id="@+id/logoutButton"
            android:layout_width="wrap_content"
            android:layout_height="36dp"
            android:text="Logout"
            android:textSize="12sp"
            android:paddingHorizontal="16dp"
            android:background="@drawable/button_background" />
    </LinearLayout>

    <!-- Content -->
    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:padding="16dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical">

            <!-- Profile Section -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:background="@drawable/card_background"
                android:padding="16dp"
                android:layout_marginBottom="24dp">

                <ImageView
                    android:id="@+id/profileImage"
                    android:layout_width="60dp"
                    android:layout_height="60dp"
                    android:src="@drawable/ic_placeholder"
                    android:contentDescription="Profile"
                    android:scaleType="centerCrop" />

                <LinearLayout
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:orientation="vertical"
                    android:marginStart="16dp">

                    <TextView
                        android:id="@+id/userNameText"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Welcome User"
                        android:textSize="16sp"
                        android:textStyle="bold"
                        android:textColor="#1c1408" />

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Patient"
                        android:textSize="12sp"
                        android:textColor="#a8956b" />
                </LinearLayout>
            </LinearLayout>

            <!-- Upcoming Appointment -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:background="@drawable/card_background"
                android:padding="16dp"
                android:layout_marginBottom="24dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Next Appointment"
                    android:textSize="14sp"
                    android:textStyle="bold"
                    android:textColor="#1c1408"
                    android:layout_marginBottom="8dp" />

                <TextView
                    android:id="@+id/upcomingAppointmentText"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="No upcoming appointments"
                    android:textSize="12sp"
                    android:textColor="#a8956b" />
            </LinearLayout>

            <!-- Action Buttons -->
            <Button
                android:id="@+id/bookButton"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:text="Book Session"
                android:textSize="14sp"
                android:textStyle="bold"
                android:background="@drawable/button_background"
                android:layout_marginBottom="12dp" />

            <Button
                android:id="@+id/myAppointmentsButton"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:text="My Appointments"
                android:textSize="14sp"
                android:textStyle="bold"
                android:background="@drawable/button_background"
                android:layout_marginBottom="12dp" />

            <Button
                android:id="@+id/profileButton"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:text="Profile Settings"
                android:textSize="14sp"
                android:textStyle="bold"
                android:background="@drawable/button_background" />
        </LinearLayout>
    </ScrollView>
</LinearLayout>
```

### Create Drawable Resources

Create `button_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#d97706" />
    <corners android:radius="8dp" />
</shape>
```

Create `card_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#ffffff" />
    <corners android:radius="10dp" />
    <stroke android:width="1dp" android:color="#e8ddd0" />
</shape>
```

Create `edit_text_background.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#ffffff" />
    <corners android:radius="8dp" />
    <stroke android:width="1.5dp" android:color="#e8ddd0" />
</shape>
```

---

## Testing & Deployment

### Step 1: Test locally with Emulator

1. **Open Android Virtual Device (AVD) Manager**
2. **Create or select an emulator** with API 24 or higher
3. **Run the app** using Android Studio's Run button (Shift+F10)

### Step 2: Update Constants for Physical Device

For testing on a physical device:
```java
// In Constants.java, change BASE_URL to your machine's IP
public static final String BASE_URL = "http://192.168.1.100:8080"; // Replace with your IP
```

### Step 3: Build APK for Distribution

1. **Go to Build > Generate Signed Bundle/APK**
2. **Select APK option**
3. **Create a keystore** or select existing
4. **Choose Release build variant**
5. **APK will be ready for distribution**

---

## Complete Feature Checklist

### Authentication ✅
- [ ] Register new user
- [ ] Login with email/password
- [ ] Token storage & management
- [ ] Auto-login on app start
- [ ] Logout

### Appointments ✅
- [ ] Book appointment
- [ ] View upcoming appointments
- [ ] View past appointments
- [ ] View cancelled appointments
- [ ] Reschedule appointment (24+ hours away)
- [ ] Cancel appointment
- [ ] See specialist availability

### Reviews ✅
- [ ] Submit review for past appointment
- [ ] View specialist ratings
- [ ] Display ratings while booking

### User Profile ✅
- [ ] View profile information
- [ ] Update profile (name, phone)
- [ ] Change password
- [ ] Upload profile picture

### Admin Features ✅
- [ ] View all appointments
- [ ] Approve/Reject appointments
- [ ] View all users

---

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running on `http://localhost:8080`
   - For emulator, use `http://10.0.2.2:8080`
   - For physical device, use your machine's IP address

2. **NetworkException: Unable to resolve host**
   - Ensure Internet permission in AndroidManifest.xml
   - Check device network connection

3. **401 Unauthorized**
   - Token might have expired
   - Check if token is properly saved in TokenManager
   - Verify Authorization header format: `Bearer {token}`

4. **CORS Issues**
   - Backend CORS is configured for `http://localhost:3000`
   - Android client doesn't use CORS, but check backend configuration

---

## Next Steps

1. Implement all activities and fragments
2. Create adapters for lists (appointments, reviews)
3. Implement profile picture upload
4. Add date/time picker for appointments
5. Add star rating widget for reviews
6. Implement push notifications for appointment updates
7. Add offline capability with Room database
8. Perform end-to-end testing

---

## Resources

- [Android Developer Documentation](https://developer.android.com/docs)
- [Retrofit Documentation](https://square.github.io/retrofit/)
- [Material Design Components](https://material.io/components)
- [Android Jetpack Libraries](https://developer.android.com/jetpack)

---

**Last Updated:** March 2026
**Status:** Complete Guide Ready for Implementation
