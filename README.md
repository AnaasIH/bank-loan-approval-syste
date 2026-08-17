# 🏦 Bank Loan Approval Enterprise System

An end-to-end automated **Bank Loan Approval Enterprise Platform** built with **Java Spring Boot**, **Camunda BPM Engine**, and **React.js**. The system automates credit approval decisions based on business rules, provides human-task reviews for high-value loans, and offers real-time analytics with PDF document generation.

---

## 🌟 Key Features

* **⚡ Automated Decision Engine:** Loans $\le$ 50,000 DH are automatically evaluated and instantly approved by the BPMN process engine.
* **🛡️ Officer Manual Review Portal:** High-value loans (> 50,000 DH) seamlessly transition to a human task queue for manual review (Approve / Reject).
* **📋 Customer Self-Service & History:** Customers can calculate monthly installments, submit new requests, and search their complete borrowing history.
* **📊 Admin Executive Dashboard:** Real-time analytics, filtering mechanisms, and visual distribution of loan statuses using **Recharts**.
* **📄 Official PDF Approval Export:** Automated generation of official loan approval certificates for accepted requests using **jsPDF**.
* **🐳 Dockerized Architecture:** Containerized setup using Docker Compose to orchestrate MySQL, Spring Boot, and React services seamlessly.

---

## 🛠️ Tech Stack & Architecture

### **Backend**
* **Language/Framework:** Java 17, Spring Boot 3
* **Workflow Engine:** Camunda BPM Engine (BPMN 2.0)
* **Security:** Spring Security & CORS Configuration
* **Database:** H2 Database (In-Memory) / MySQL 8
* **Persistence:** Spring Data JPA / Hibernate

### **Frontend**
* **Framework:** React.js (Hooks & Context)
* **Data Visualization:** Recharts
* **Document Generation:** jsPDF / html2canvas
* **HTTP Client:** Axios
* **Styling:** Custom Enterprise CSS

---

## 📐 BPMN Workflow Logic




[ Customer Applies ]
│
▼
< Amount <= 50,000 DH? >
│              │
Yes             No
│              │
▼              ▼
[ Instant ]    [ Manual Review ]
[ Approval ]   [  (Officer)   ]
│              │
├──────────────┴──────────────┐
▼                             ▼
[ Approved ✅ ]               [ Rejected ❌ ]





---

## 🚀 Getting Started

### Prerequisites
* **Java Development Kit (JDK 17)** or higher
* **Node.js (v18+)** and **npm**
* **Maven** (included via `./mvnw` wrapper)

---

### 1. Backend Setup (Spring Boot & Camunda)

```bash
# Navigate to the backend directory
cd backend/loan-approval-service

# Run the application using Maven
./mvnw spring-boot:run


Backend API Base URL: http://localhost:8080/api/loans

Camunda Cockpit URL: http://localhost:8080/camunda (Credentials: admin / adminpassword)

# Navigate to the frontend directory
cd frontend/loan-approval-ui

# Install dependencies
npm install

# Start the development server
npm start


