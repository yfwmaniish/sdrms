import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Transform as TransformIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

function Upload() {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [activeStep, setActiveStep] = useState(0);
  const [telecomCompany, setTelecomCompany] = useState('');
  const [datasetType, setDatasetType] = useState('');
  const [processingStatus, setProcessingStatus] = useState(null);
  const [mappingDialog, setMappingDialog] = useState(false);
  const [fieldMapping, setFieldMapping] = useState({});
  const [detectedColumns, setDetectedColumns] = useState([]);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [validationResults, setValidationResults] = useState([]);
  
  // Standard SDRMS schema fields
  const standardFields = [
    { field: 'msisdn', label: 'MSISDN/Phone Number', required: true, type: 'string' },
    { field: 'imsi', label: 'IMSI', required: true, type: 'string' },
    { field: 'imei', label: 'IMEI', required: false, type: 'string' },
    { field: 'subscriber_name', label: 'Subscriber Name', required: false, type: 'string' },
    { field: 'subscriber_type', label: 'Subscriber Type', required: false, type: 'string' },
    { field: 'plan_type', label: 'Plan Type', required: false, type: 'string' },
    { field: 'status', label: 'Status', required: true, type: 'string' },
    { field: 'activation_date', label: 'Activation Date', required: false, type: 'date' },
    { field: 'last_activity', label: 'Last Activity', required: false, type: 'datetime' },
    { field: 'location', label: 'Location/Circle', required: false, type: 'string' },
    { field: 'data_usage', label: 'Data Usage (GB)', required: false, type: 'number' },
    { field: 'voice_usage', label: 'Voice Usage (mins)', required: false, type: 'number' },
    { field: 'sms_count', label: 'SMS Count', required: false, type: 'number' },
    { field: 'revenue', label: 'Revenue', required: false, type: 'number' },
    { field: 'roaming_status', label: 'Roaming Status', required: false, type: 'string' },
    { field: 'network_type', label: 'Network Type (2G/3G/4G/5G)', required: false, type: 'string' },
    { field: 'device_model', label: 'Device Model', required: false, type: 'string' },
    { field: 'tariff_plan', label: 'Tariff Plan', required: false, type: 'string' },
    { field: 'billing_address', label: 'Billing Address', required: false, type: 'string' },
    { field: 'kyc_status', label: 'KYC Status', required: false, type: 'string' }
  ];
  
  const telecomCompanies = [
    'Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'MTNL', 'Tata Teleservices',
    'Aircel', 'Telenor', 'MTS', 'Videocon', 'Uninor', 'Other'
  ];
  
  const datasetTypes = [
    'CDR (Call Detail Records)',
    'Subscriber Master Data',
    'Billing Records',
    'Data Usage Records',
    'Roaming Records',
    'VLR (Visitor Location Register)',
    'HLR (Home Location Register)',
    'Network Events',
    'Revenue Records',
    'Device Information'
  ];
  
  const steps = [
    'Upload Files',
    'Configure Dataset',
    'Map Fields',
    'Validate Data',
    'Process & Store'
  ];

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
    multiple: true
  });

  // Simulate column detection from uploaded files
  const detectColumns = async (file) => {
    // In real implementation, this would parse the first few rows
    const mockColumns = [
      'phone_number', 'imsi_code', 'imei_number', 'customer_name', 
      'account_type', 'service_plan', 'connection_status', 'start_date',
      'last_used', 'circle_name', 'data_consumed', 'call_minutes',
      'sms_sent', 'monthly_bill', 'roaming_enabled', 'network_gen',
      'handset_model', 'rate_plan', 'address', 'document_verified'
    ];
    setDetectedColumns(mockColumns);
    setTotalRecords(500000000); // 50 crore mock records
    return mockColumns;
  };

  const handleUpload = async () => {
    if (!telecomCompany || !datasetType) {
      setAlertMessage('Please select telecom company and dataset type first!');
      setAlertSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      setUploadProgress(0);
      setActiveStep(1);
      
      // Step 1: Upload files
      setAlertMessage('Uploading files...');
      setAlertSeverity('info');
      setOpenSnackbar(true);

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Step 2: Detect columns
      setActiveStep(2);
      await detectColumns(files[0]);
      setMappingDialog(true);

      setAlertMessage('Files uploaded successfully! Please map the fields.');
      setAlertSeverity('success');
      setOpenSnackbar(true);

    } catch (error) {
      setAlertMessage('Error uploading files!');
      setAlertSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleFieldMapping = (standardField, detectedColumn) => {
    setFieldMapping(prev => ({
      ...prev,
      [standardField]: detectedColumn
    }));
  };

  const validateMappings = () => {
    const requiredFields = standardFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !fieldMapping[f.field]);
    
    if (missingFields.length > 0) {
      setAlertMessage(`Please map required fields: ${missingFields.map(f => f.label).join(', ')}`);
      setAlertSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    return true;
  };

  const startDataProcessing = async () => {
    if (!validateMappings()) return;

    setMappingDialog(false);
    setActiveStep(3);
    setProcessingStatus('validating');

    try {
      // Step 3: Data Validation
      const mockValidationResults = [
        { type: 'success', message: 'MSISDN format validation completed', count: 498750000 },
        { type: 'warning', message: 'Invalid IMSI format detected', count: 1200000 },
        { type: 'error', message: 'Duplicate records found', count: 50000 },
        { type: 'info', message: 'Missing optional fields', count: 5000000 }
      ];
      
      setValidationResults(mockValidationResults);
      
      // Simulate validation progress
      for (let i = 0; i <= 100; i += 5) {
        setProcessedRecords(Math.floor((totalRecords * i) / 100));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setActiveStep(4);
      setProcessingStatus('processing');

      // Step 4: Data Processing and Storage
      setAlertMessage('Starting data processing and storage...');
      setAlertSeverity('info');
      setOpenSnackbar(true);

      // Simulate processing progress
      for (let i = 0; i <= 100; i += 2) {
        setProcessedRecords(Math.floor((totalRecords * i) / 100));
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      setProcessingStatus('completed');
      setAlertMessage('Data processing completed successfully!');
      setAlertSeverity('success');
      setOpenSnackbar(true);

    } catch (error) {
      setProcessingStatus('error');
      setAlertMessage('Error during data processing!');
      setAlertSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(1) + ' Cr';
    } else if (num >= 100000) {
      return (num / 100000).toFixed(1) + ' L';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Upload Data
      </Typography>

      <Paper {...getRootProps({ className: 'dropzone' })} sx={{ p: 3, textAlign: 'center', mb: 3 }}>
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Drag 'n' drop some files here, or click to select files
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Supports CSV or Excel files
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Selected Files
          </Typography>
          <Paper sx={{ p: 2, mb: 2 }}>
            <ul>
              {files.map((file) => (
                <li key={file.path}>{file.path} - {file.size} bytes</li>
              ))}
            </ul>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleUpload}
              disabled={uploadProgress > 0 && uploadProgress < 100}
            >
              Upload Files
            </Button>
          </Paper>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Box>
      )}

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Upload;
