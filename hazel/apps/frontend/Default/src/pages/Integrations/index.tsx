import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Spinner,
  Badge,
  Button,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormFeedback,
  Alert,
} from 'reactstrap';
import BreadCrumb from '../../Components/Common/BreadCrumb';
import { integrationsAPI, Webhook, IntegrationLog, CreateWebhookDto } from '../../api/integrations';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const IntegrationsPage: React.FC = () => {
  document.title = 'Integrations | Hazel Inventory';

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [webhooksData, logsData] = await Promise.all([
        integrationsAPI.listWebhooks(),
        integrationsAPI.getIntegrationLogs(),
      ]);
      setWebhooks(webhooksData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load integrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load integrations data');
      toast.error('Failed to load integrations data');
    } finally {
      setLoading(false);
    }
  };

  const webhookValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      event: '',
      targetUrl: '',
      isActive: true,
    },
    validationSchema: Yup.object({
      event: Yup.string().required('Event is required').oneOf(['order.created', 'order.fulfilled', 'inventory.low_stock'], 'Invalid event'),
      targetUrl: Yup.string().required('Target URL is required').url('Invalid URL'),
      isActive: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      try {
        await integrationsAPI.createWebhook(values);
        toast.success('Webhook created successfully');
        setIsWebhookModalOpen(false);
        webhookValidation.resetForm();
        loadData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create webhook');
      }
    },
  });

  const importValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      csvContent: '',
    },
    validationSchema: Yup.object({
      csvContent: Yup.string().required('CSV content is required'),
    }),
    onSubmit: async (values) => {
      try {
        const result = await integrationsAPI.importProducts(values.csvContent);
        toast.success(`Import completed: ${result.success} succeeded, ${result.failed} failed`);
        setIsImportModalOpen(false);
        importValidation.resetForm();
        if (result.errors.length > 0) {
          console.warn('Import errors:', result.errors);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to import products');
      }
    },
  });

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setTestingWebhookId(webhookId);
      const result = await integrationsAPI.testWebhook(webhookId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to test webhook');
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleExport = async (type: 'products' | 'inventory' | 'orders') => {
    try {
      setExporting(type);
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'products':
          blob = await integrationsAPI.exportProducts();
          filename = 'products.csv';
          break;
        case 'inventory':
          blob = await integrationsAPI.exportInventory();
          filename = 'inventory.csv';
          break;
        case 'orders':
          blob = await integrationsAPI.exportOrders();
          filename = 'orders.csv';
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported ${type} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  const getEventBadgeColor = (event: string): string => {
    if (event.includes('order')) return 'primary';
    if (event.includes('inventory')) return 'warning';
    return 'secondary';
  };

  const getStatusBadgeColor = (status: string): string => {
    return status === 'SUCCESS' ? 'success' : 'danger';
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Integrations" pageTitle="Settings" />
          
          {/* CSV Export Section */}
          <Row className="mb-4">
            <Col>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">CSV Export</h5>
                </CardHeader>
                <CardBody>
                  <Row className="g-3">
                    <Col md={4}>
                      <Button
                        color="primary"
                        className="w-100"
                        onClick={() => handleExport('products')}
                        disabled={!!exporting}
                      >
                        {exporting === 'products' ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FeatherIcon icon="download" className="me-1" size={16} />
                            Export Products
                          </>
                        )}
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button
                        color="info"
                        className="w-100"
                        onClick={() => handleExport('inventory')}
                        disabled={!!exporting}
                      >
                        {exporting === 'inventory' ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FeatherIcon icon="download" className="me-1" size={16} />
                            Export Inventory
                          </>
                        )}
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button
                        color="success"
                        className="w-100"
                        onClick={() => handleExport('orders')}
                        disabled={!!exporting}
                      >
                        {exporting === 'orders' ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <FeatherIcon icon="download" className="me-1" size={16} />
                            Export Orders
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* CSV Import Section */}
          <Row className="mb-4">
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">CSV Import</h5>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <FeatherIcon icon="upload" className="me-1" size={14} />
                    Import Products
                  </Button>
                </CardHeader>
                <CardBody>
                  <Alert color="info">
                    <strong>CSV Format:</strong> Headers: name, sku, description (optional), lifecycle status (optional), collectionId (optional)
                  </Alert>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Webhooks Section */}
          <Row className="mb-4">
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Webhooks</h5>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => setIsWebhookModalOpen(true)}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={14} />
                    Create Webhook
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Loading webhooks...</p>
                    </div>
                  ) : webhooks.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="webhook" size={64} />
                      </div>
                      <h5>No Webhooks</h5>
                      <p className="text-muted">Create your first webhook to receive event notifications.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Event</th>
                            <th scope="col">Target URL</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created</th>
                            <th scope="col" className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webhooks.map((webhook) => (
                            <tr key={webhook.id}>
                              <td>
                                <Badge color={getEventBadgeColor(webhook.event)}>
                                  {webhook.event}
                                </Badge>
                              </td>
                              <td>
                                <code className="text-muted">{webhook.targetUrl}</code>
                              </td>
                              <td>
                                <Badge color={webhook.isActive ? 'success' : 'secondary'}>
                                  {webhook.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td>{new Date(webhook.createdAt).toLocaleDateString()}</td>
                              <td className="text-end">
                                <Button
                                  color="info"
                                  size="sm"
                                  onClick={() => handleTestWebhook(webhook.id)}
                                  disabled={testingWebhookId === webhook.id}
                                >
                                  {testingWebhookId === webhook.id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <FeatherIcon icon="send" size={14} />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Integration Logs Section */}
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Integration Logs</h5>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner color="primary" />
                      <p className="mt-2 text-muted">Loading logs...</p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="file-text" size={64} />
                      </div>
                      <h5>No Logs</h5>
                      <p className="text-muted">Integration logs will appear here when webhooks are triggered.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Integration ID</th>
                            <th scope="col">Status</th>
                            <th scope="col">Payload</th>
                            <th scope="col">Response</th>
                            <th scope="col">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log.id}>
                              <td>
                                <code className="text-muted">{log.integrationId.substring(0, 8)}...</code>
                              </td>
                              <td>
                                <Badge color={getStatusBadgeColor(log.status)}>
                                  {log.status}
                                </Badge>
                              </td>
                              <td>
                                {log.payload ? (
                                  <code className="text-muted" style={{ fontSize: '12px' }}>
                                    {log.payload.substring(0, 50)}...
                                  </code>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                {log.response ? (
                                  <code className="text-muted" style={{ fontSize: '12px' }}>
                                    {log.response.substring(0, 50)}...
                                  </code>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Create Webhook Modal */}
          <Modal isOpen={isWebhookModalOpen} toggle={() => setIsWebhookModalOpen(false)} centered>
            <ModalHeader toggle={() => setIsWebhookModalOpen(false)}>
              Create Webhook
            </ModalHeader>
            <form onSubmit={webhookValidation.handleSubmit}>
              <ModalBody>
                <div className="mb-3">
                  <Label className="form-label">Event *</Label>
                  <Input
                    type="select"
                    name="event"
                    value={webhookValidation.values.event}
                    onChange={webhookValidation.handleChange}
                    onBlur={webhookValidation.handleBlur}
                    invalid={webhookValidation.touched.event && !!webhookValidation.errors.event}
                  >
                    <option value="">Select an event</option>
                    <option value="order.created">Order Created</option>
                    <option value="order.fulfilled">Order Fulfilled</option>
                    <option value="inventory.low_stock">Inventory Low Stock</option>
                  </Input>
                  {webhookValidation.touched.event && webhookValidation.errors.event && (
                    <FormFeedback type="invalid">{webhookValidation.errors.event}</FormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <Label className="form-label">Target URL *</Label>
                  <Input
                    type="url"
                    name="targetUrl"
                    placeholder="https://example.com/webhook"
                    value={webhookValidation.values.targetUrl}
                    onChange={webhookValidation.handleChange}
                    onBlur={webhookValidation.handleBlur}
                    invalid={webhookValidation.touched.targetUrl && !!webhookValidation.errors.targetUrl}
                  />
                  {webhookValidation.touched.targetUrl && webhookValidation.errors.targetUrl && (
                    <FormFeedback type="invalid">{webhookValidation.errors.targetUrl}</FormFeedback>
                  )}
                </div>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <Input
                      type="checkbox"
                      className="form-check-input"
                      name="isActive"
                      checked={webhookValidation.values.isActive}
                      onChange={webhookValidation.handleChange}
                    />
                    <Label className="form-check-label">Active</Label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="button"
                  color="light"
                  onClick={() => setIsWebhookModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={!webhookValidation.isValid}
                >
                  Create Webhook
                </Button>
              </ModalFooter>
            </form>
          </Modal>

          {/* Import Products Modal */}
          <Modal isOpen={isImportModalOpen} toggle={() => setIsImportModalOpen(false)} size="lg" centered>
            <ModalHeader toggle={() => setIsImportModalOpen(false)}>
              Import Products from CSV
            </ModalHeader>
            <form onSubmit={importValidation.handleSubmit}>
              <ModalBody>
                <Alert color="info" className="mb-3">
                  <strong>CSV Format:</strong> Headers must include: <code>name</code>, <code>sku</code>. Optional: <code>description</code>, <code>lifecycle status</code>, <code>collectionId</code>
                </Alert>
                <div className="mb-3">
                  <Label className="form-label">CSV Content *</Label>
                  <Input
                    type="textarea"
                    rows={10}
                    name="csvContent"
                    placeholder="name,sku,description,lifecycle status,collectionId&#10;Product 1,SKU-001,Description,DRAFT,"
                    value={importValidation.values.csvContent}
                    onChange={importValidation.handleChange}
                    onBlur={importValidation.handleBlur}
                    invalid={importValidation.touched.csvContent && !!importValidation.errors.csvContent}
                  />
                  {importValidation.touched.csvContent && importValidation.errors.csvContent && (
                    <FormFeedback type="invalid">{importValidation.errors.csvContent}</FormFeedback>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="button"
                  color="light"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={!importValidation.isValid}
                >
                  <FeatherIcon icon="upload" className="me-1" size={14} />
                  Import Products
                </Button>
              </ModalFooter>
            </form>
          </Modal>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default IntegrationsPage;
