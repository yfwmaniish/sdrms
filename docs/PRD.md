# 📄 Product Requirements Document (PRD)
**Project:** Subscriber Data Record Management System (SDRMS)  
**Version:** 1.0  
**Owner:** SDRMS Team  
**Date:** 2025-07-26  

## 1. 🧭 Overview
The Subscriber Data Record Management System (SDRMS) is a self-hosted platform to manage and search telecom subscriber data for the state of Haryana. It aims to provide fast, flexible access to subscriber records, including fraud detection capabilities, advanced search, and secure data handling, all hosted on internal infrastructure with no dependency on cloud services.

## 2. 🎯 Goals & Objectives
- Create a scalable, secure, and performant subscriber database
- Enable powerful search on subscriber data (name, number, address, identifiers)
- Support flexible data formats (TXT, XLSX, CSV, MDB)
- Detect anomalies such as fake identities and unusual SIM behavior
- Maintain self-hosted infrastructure — no AWS or cloud reliance
- Enable real-time syncing between MongoDB (storage) and OpenSearch (search)

## 3. 🔍 Key Features

### 3.1 Data Storage & Structure
- **Primary datastore:** MongoDB
- Stores raw subscriber data in JSON-like documents
- Accepts structured and semi-structured input (bulk uploads)

### 3.2 Search Functionality
- Powered by OpenSearch (self-hosted fork of Elasticsearch)
- Full-text and fuzzy search on fields:
  - Subscriber name
  - Mobile number
  - Address
  - SIM ID / Device ID
- Search results sorted by relevance or metadata

### 3.3 Data Syncing
- Change Streams-based custom sync service
- Monitors MongoDB for insert/update/delete events
- Pushes transformed data to OpenSearch in near real-time

### 3.4 Fraud & Anomaly Detection (Future Enhancement)
- Identify duplicate/fake identities
- Track abnormal SIM swap patterns or number churn
- Leverage basic ML models or rules-based detection
- Manual tagging of suspicious records

### 3.5 User Dashboard
- Secure web-based dashboard with role-based access
- Modules:
  - Search interface
  - Record viewer
  - Bulk data uploader
  - Anomaly alerts
- Built using modern frontend (React/Angular) + REST APIs

## 4. 🔧 Architecture Overview
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

## 5. 🛠️ Technology Stack
| Layer | Tool/Tech |
|-------|-----------|
| Data Store | MongoDB (Replica Set) |
| Search Engine | OpenSearch |
| Sync Layer | Custom Python/Node.js service |
| Frontend Dashboard | React or Angular |
| Backend APIs | Express.js / FastAPI |
| Bulk Upload Parser | Python Pandas / Node Parsers |
| Security | TLS, RBAC, OpenSearch Security |
| Monitoring | Prometheus + Grafana |
| Deployment | Docker / systemd (self-hosted) |

## 6. 🔐 Security Requirements
- Role-based access control (Admin, Analyst, Viewer)
- Encrypted connections (TLS)
- MongoDB auth & IP whitelisting
- OpenSearch security plugin for auth & audit logging
- No public access – intranet or VPN only

## 7. 📁 Data Input Requirements
**Accepted formats:**
- .TXT (delimited)
- .CSV
- .XLSX
- .MDB (Access)

- Field mapping UI for custom file formats
- Support for bulk ingest with normalization

## 8. 📈 Non-Functional Requirements
| Category | Requirement |
|----------|-------------|
| Performance | Search results in < 500ms for 1M+ records |
| Scalability | Horizontally scalable MongoDB and OpenSearch |
| Uptime | 99.5% minimum (excluding maintenance) |
| Storage | Support up to 100M records |
| Maintainability | Modular components, clean logging, containerized |
| Latency (Sync) | Data sync delay < 2 seconds (avg) |

## 9. 🧪 Testing & QA
- Unit tests for sync service and API
- Load testing for OpenSearch queries
- Data integrity checks (Mongo → OpenSearch)
- User acceptance testing (UAT) on dashboard

## 10. 🚧 Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Data inconsistency between DBs | Periodic audit scripts & sync retries |
| OpenSearch memory overload | Index optimization + shard tuning |
| Bad/malformed uploads | Validation layer in upload pipeline |
| Unauthorized access | Full access control + audit trails |

## 11. 📅 Timeline (Suggested Phases)
| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Setup | 2 weeks | MongoDB, OpenSearch, Docker setup |
| Phase 2: Sync Logic | 3 weeks | Change stream → OpenSearch service |
| Phase 3: Dashboard | 4 weeks | UI + search API + bulk import tool |
| Phase 4: Hardening | 2 weeks | Security, backup, monitoring |
| Phase 5: UAT | 2 weeks | Testing & documentation |

## 12. 📝 Appendix
- MongoDB Schema example
- Sample search queries
- Sync code pseudocode
- Data mapping templates
- Field list and expected formats
