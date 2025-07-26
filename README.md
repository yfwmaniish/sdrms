# Subscriber Data Record Management System (SDRMS)

A self-hosted platform for managing and searching telecom subscriber data for the state of Haryana.

## 🧭 Overview

The Subscriber Data Record Management System (SDRMS) provides fast, flexible access to subscriber records with fraud detection capabilities, advanced search, and secure data handling - all hosted on internal infrastructure with no cloud dependencies.

## 🎯 Key Features

- **Scalable Data Storage**: MongoDB-based primary datastore
- **Powerful Search**: OpenSearch-powered full-text and fuzzy search
- **Real-time Sync**: Custom sync service between MongoDB and OpenSearch
- **Multi-format Support**: TXT, CSV, XLSX, MDB file imports
- **Security First**: Role-based access control with TLS encryption
- **Fraud Detection**: Anomaly detection for fake identities and suspicious patterns

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Data Store | MongoDB (Replica Set) |
| Search Engine | OpenSearch |
| Sync Service | Node.js/Python |
| Frontend | React |
| Backend API | Express.js |
| Security | TLS, RBAC, OpenSearch Security |
| Monitoring | Prometheus + Grafana |
| Deployment | Docker |

## 🏗️ Architecture

```
[ Data Upload / Bulk Import ]
           ↓
     [ MongoDB ]
           ↓ (Change Stream)
 [ Custom Sync Service ]
           ↓
     [ OpenSearch ]
           ↓
[ OpenSearch Dashboards / UI ]
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yfwmaniish/sdrms.git
cd sdrms
```

2. Start the services:
```bash
docker-compose up -d
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
npm start
```

4. Install backend dependencies:
```bash
cd backend
npm install
npm run dev
```

## 📁 Project Structure

```
sdrms/
├── backend/                 # Express.js API server
├── frontend/               # React dashboard
├── sync-service/           # MongoDB to OpenSearch sync
├── docker/                 # Docker configurations
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## 🔐 Security

- Role-based access control (Admin, Analyst, Viewer)
- TLS encryption for all connections
- MongoDB authentication and IP whitelisting
- OpenSearch security plugin
- Intranet/VPN only access

## 📈 Performance

- Search results < 500ms for 1M+ records
- Data sync delay < 2 seconds average
- Supports up to 100M records
- 99.5% uptime target

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:load
```

## 📅 Development Phases

- [x] Phase 1: Project setup and infrastructure
- [ ] Phase 2: Sync service implementation
- [ ] Phase 3: Dashboard and API development
- [ ] Phase 4: Security hardening
- [ ] Phase 5: User acceptance testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.
