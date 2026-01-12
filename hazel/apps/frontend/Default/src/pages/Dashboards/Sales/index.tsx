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
import { dashboardsAPI, SalesDashboard } from '../../../api/dashboards';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';

const SalesDashboardPage: React.FC = () => {
  document.title = 'Sales Dashboard | Hazel Inventory';

  const [dashboard, setDashboard] = useState<SalesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');

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
      if (channelFilter) filters.channel = channelFilter;
      
      const data = await dashboardsAPI.getSalesDashboard(filters);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load sales dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      toast.error('Failed to load sales dashboard');
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
    setChannelFilter('');
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

  const getChannelBadgeColor = (channel: string): string => {
    switch (channel) {
      case 'DTC':
        return 'primary';
      case 'B2B':
        return 'info';
      case 'WHOLESALE':
        return 'warning';
      case 'RETAIL':
        return 'success';
      case 'POS':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Sales Dashboard" pageTitle="Dashboards" />
          
          {/* Filters */}
          <Row className="mb-4">
            <Col>
              <Card>
                <CardBody>
                  <Row className="g-3">
                    <Col md={3}>
                      <Label className="form-label">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label className="form-label">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label className="form-label">Channel</Label>
                      <Input
                        type="select"
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                      >
                        <option value="">All Channels</option>
                        <option value="DTC">DTC</option>
                        <option value="B2B">B2B</option>
                        <option value="WHOLESALE">Wholesale</option>
                        <option value="RETAIL">Retail</option>
                        <option value="POS">POS</option>
                      </Input>
                    </Col>
                    <Col md={3} className="d-flex align-items-end gap-2">
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
                      <p className="mt-2">Loading sales dashboard...</p>
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
                            {formatCurrency(dashboard.totalRevenue || 0, dashboard.currency || 'USD')}
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

                {/* Total Orders */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Total Orders</p>
                          <h4 className="mb-0 mt-2">
                            {(dashboard.totalOrders || 0).toLocaleString()}
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

                {/* Order Conversion Rate */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Conversion Rate</p>
                          <h4 className={`mb-0 mt-2 ${(dashboard.orderConversionRate || 0) >= 80 ? 'text-success' : (dashboard.orderConversionRate || 0) >= 60 ? 'text-warning' : 'text-danger'}`}>
                            {(dashboard.orderConversionRate || 0).toFixed(1)}%
                          </h4>
                          <small className="text-muted">Confirmed / Total</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${(dashboard.orderConversionRate || 0) >= 80 ? 'bg-success-subtle' : (dashboard.orderConversionRate || 0) >= 60 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="target" className={(dashboard.orderConversionRate || 0) >= 80 ? 'text-success' : (dashboard.orderConversionRate || 0) >= 60 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Revenue by Channel Table */}
              <Row className="mb-4">
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Revenue by Channel</h5>
                    </CardHeader>
                    <CardBody>
                      {!dashboard.revenueByChannel || dashboard.revenueByChannel.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="text-muted mb-3">
                            <FeatherIcon icon="inbox" size={64} />
                          </div>
                          <h5>No Data Available</h5>
                          <p className="text-muted">No revenue data found for the selected filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Channel</th>
                                <th scope="col" className="text-end">Revenue</th>
                                <th scope="col" className="text-end">Percentage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.revenueByChannel.map((item) => (
                                <tr key={item.channel}>
                                  <td>
                                    <Badge color={getChannelBadgeColor(item.channel)}>
                                      {item.channel}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatCurrency(item.revenue || 0, dashboard.currency || 'USD')}
                                  </td>
                                  <td className="text-end">
                                    <Badge color="info">{(item.percentage || 0).toFixed(1)}%</Badge>
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

              {/* Top Customers Table */}
              <Row>
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Top Customers</h5>
                    </CardHeader>
                    <CardBody>
                      {!dashboard.topCustomers || dashboard.topCustomers.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="text-muted mb-3">
                            <FeatherIcon icon="users" size={64} />
                          </div>
                          <h5>No Data Available</h5>
                          <p className="text-muted">No customer data found for the selected filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Customer</th>
                                <th scope="col" className="text-end">Revenue</th>
                                <th scope="col" className="text-end">Orders</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.topCustomers.map((customer) => (
                                <tr key={customer.customerId}>
                                  <td>
                                    <Link
                                      to={`/customers/${customer.customerId}`}
                                      className="text-decoration-none fw-medium"
                                    >
                                      {customer.companyName}
                                    </Link>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatCurrency(customer.revenue, dashboard.currency)}
                                  </td>
                                  <td className="text-end">
                                    <Badge color="primary">{customer.orderCount}</Badge>
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

export default SalesDashboardPage;
