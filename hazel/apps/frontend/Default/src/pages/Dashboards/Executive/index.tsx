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
  Input,
  Label,
  Button,
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { dashboardsAPI, ExecutiveDashboard } from '../../../api/dashboards';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const ExecutiveDashboardPage: React.FC = () => {
  document.title = 'Executive Dashboard | Hazel Inventory';

  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await dashboardsAPI.getExecutiveDashboard(filters);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load executive dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      toast.error('Failed to load executive dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      loadData();
    }, 0);
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Executive Dashboard" pageTitle="Dashboards" />
          
          {/* Filters */}
          <Row className="mb-4">
            <Col>
              <Card>
                <CardBody>
                  <Row className="g-3">
                    <Col md={4}>
                      <Label className="form-label">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Col>
                    <Col md={4}>
                      <Label className="form-label">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Col>
                    <Col md={4} className="d-flex align-items-end gap-2">
                      <Button
                        color="primary"
                        onClick={handleApplyFilters}
                        disabled={loading}
                      >
                        <FeatherIcon icon="filter" className="me-1" size={16} />
                        Apply Filters
                      </Button>
                      <Button
                        color="light"
                        onClick={handleClearFilters}
                        disabled={loading}
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* KPI Cards */}
          {loading ? (
            <Row>
              <Col>
                <Card>
                  <CardBody>
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading executive dashboard...</p>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : error ? (
            <Row>
              <Col>
                <Card>
                  <CardBody>
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadData}>
                        Retry
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : dashboard ? (
            <>
              <Row className="mb-4">
                {/* Total Revenue */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Total Revenue</p>
                          <h4 className="mb-0 mt-2">
                            {formatCurrency(dashboard.totalRevenue, dashboard.currency)}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-success-subtle rounded fs-2">
                              <FeatherIcon icon="dollar-sign" className="text-success" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Gross Margin */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Gross Margin</p>
                          <h4 className={`mb-0 mt-2 ${dashboard.grossMarginPercent >= 30 ? 'text-success' : dashboard.grossMarginPercent >= 20 ? 'text-warning' : 'text-danger'}`}>
                            {dashboard.grossMarginPercent.toFixed(1)}%
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${dashboard.grossMarginPercent >= 30 ? 'bg-success-subtle' : dashboard.grossMarginPercent >= 20 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="trending-up" className={dashboard.grossMarginPercent >= 30 ? 'text-success' : dashboard.grossMarginPercent >= 20 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Total Orders */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Total Orders</p>
                          <h4 className="mb-0 mt-2">
                            {dashboard.totalOrders.toLocaleString()}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-primary-subtle rounded fs-2">
                              <FeatherIcon icon="shopping-cart" className="text-primary" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Active Customers */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Active Customers</p>
                          <h4 className="mb-0 mt-2">
                            {dashboard.activeCustomers.toLocaleString()}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-info-subtle rounded fs-2">
                              <FeatherIcon icon="users" className="text-info" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Inventory Value */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Inventory Value</p>
                          <h4 className="mb-0 mt-2">
                            {formatCurrency(dashboard.inventoryValue, dashboard.currency)}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-warning-subtle rounded fs-2">
                              <FeatherIcon icon="package" className="text-warning" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Order Fulfillment Rate */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Fulfillment Rate</p>
                          <h4 className={`mb-0 mt-2 ${dashboard.orderFulfillmentRate >= 90 ? 'text-success' : dashboard.orderFulfillmentRate >= 75 ? 'text-warning' : 'text-danger'}`}>
                            {dashboard.orderFulfillmentRate.toFixed(1)}%
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${dashboard.orderFulfillmentRate >= 90 ? 'bg-success-subtle' : dashboard.orderFulfillmentRate >= 75 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="check-circle" className={dashboard.orderFulfillmentRate >= 90 ? 'text-success' : dashboard.orderFulfillmentRate >= 75 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Summary Table */}
              <Row>
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Executive Summary</h5>
                    </CardHeader>
                    <CardBody>
                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th scope="col">Metric</th>
                              <th scope="col" className="text-end">Value</th>
                              <th scope="col">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="fw-medium">Total Revenue</td>
                              <td className="text-end">{formatCurrency(dashboard.totalRevenue, dashboard.currency)}</td>
                              <td>
                                <Badge color="success">Healthy</Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Gross Margin</td>
                              <td className="text-end">{dashboard.grossMarginPercent.toFixed(1)}%</td>
                              <td>
                                <Badge color={dashboard.grossMarginPercent >= 30 ? 'success' : dashboard.grossMarginPercent >= 20 ? 'warning' : 'danger'}>
                                  {dashboard.grossMarginPercent >= 30 ? 'Excellent' : dashboard.grossMarginPercent >= 20 ? 'Good' : 'Low'}
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Total Orders</td>
                              <td className="text-end">{dashboard.totalOrders.toLocaleString()}</td>
                              <td>
                                <Badge color="info">Active</Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Active Customers</td>
                              <td className="text-end">{dashboard.activeCustomers.toLocaleString()}</td>
                              <td>
                                <Badge color="info">Active</Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Inventory Value</td>
                              <td className="text-end">{formatCurrency(dashboard.inventoryValue, dashboard.currency)}</td>
                              <td>
                                <Badge color="warning">In Stock</Badge>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">Order Fulfillment Rate</td>
                              <td className="text-end">{dashboard.orderFulfillmentRate.toFixed(1)}%</td>
                              <td>
                                <Badge color={dashboard.orderFulfillmentRate >= 90 ? 'success' : dashboard.orderFulfillmentRate >= 75 ? 'warning' : 'danger'}>
                                  {dashboard.orderFulfillmentRate >= 90 ? 'Excellent' : dashboard.orderFulfillmentRate >= 75 ? 'Good' : 'Needs Improvement'}
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <Row>
              <Col>
                <Card>
                  <CardBody>
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="bar-chart-2" size={64} />
                      </div>
                      <h5>No Dashboard Data Available</h5>
                      <p className="text-muted">No data found for the selected period.</p>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ExecutiveDashboardPage;
