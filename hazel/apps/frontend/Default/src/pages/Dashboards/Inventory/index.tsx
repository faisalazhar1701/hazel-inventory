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
import { dashboardsAPI, InventoryDashboard } from '../../../api/dashboards';
import { warehousesAPI } from '../../../api/warehouses';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const InventoryDashboardPage: React.FC = () => {
  document.title = 'Inventory Dashboard | Hazel Inventory';

  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');

  useEffect(() => {
    loadWarehouses();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (warehouseFilter) filters.warehouseId = warehouseFilter;
      
      const data = await dashboardsAPI.getInventoryDashboard(filters);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load inventory dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      toast.error('Failed to load inventory dashboard');
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
    setWarehouseFilter('');
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
          <BreadCrumb title="Inventory Dashboard" pageTitle="Dashboards" />
          
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
                      <Label className="form-label">Warehouse</Label>
                      <Input
                        type="select"
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                      >
                        <option value="">All Warehouses</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
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
                      <p className="mt-2">Loading inventory dashboard...</p>
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

                {/* Low Stock Variants */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Low Stock Variants</p>
                          <h4 className={`mb-0 mt-2 ${dashboard.lowStockVariantsCount === 0 ? 'text-success' : dashboard.lowStockVariantsCount < 10 ? 'text-warning' : 'text-danger'}`}>
                            {dashboard.lowStockVariantsCount.toLocaleString()}
                          </h4>
                          <small className="text-muted">Quantity &lt; 10</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${dashboard.lowStockVariantsCount === 0 ? 'bg-success-subtle' : dashboard.lowStockVariantsCount < 10 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="alert-triangle" className={dashboard.lowStockVariantsCount === 0 ? 'text-success' : dashboard.lowStockVariantsCount < 10 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Stock Turnover */}
                <Col xl={4} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Stock Turnover</p>
                          <h4 className="mb-0 mt-2">
                            {dashboard.stockTurnover.toFixed(2)}%
                          </h4>
                          <small className="text-muted">Units sold / Inventory value</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-info-subtle rounded fs-2">
                              <FeatherIcon icon="repeat" className="text-info" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Warehouse Inventory Value Table */}
              <Row>
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Warehouses with Highest Movement</h5>
                    </CardHeader>
                    <CardBody>
                      {dashboard.warehousesWithHighestMovement.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="text-muted mb-3">
                            <FeatherIcon icon="inbox" size={64} />
                          </div>
                          <h5>No Data Available</h5>
                          <p className="text-muted">No warehouse movement data found for the selected filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Warehouse</th>
                                <th scope="col" className="text-end">Inventory Movements</th>
                                <th scope="col" className="text-end">Inventory Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.warehousesWithHighestMovement.map((warehouse) => (
                                <tr key={warehouse.warehouseId}>
                                  <td>
                                    <div className="fw-medium">{warehouse.warehouseName}</div>
                                  </td>
                                  <td className="text-end">
                                    <Badge color="info" className="fs-6">
                                      {warehouse.inventoryMovements.toLocaleString()}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatCurrency(warehouse.inventoryValue, dashboard.currency)}
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

export default InventoryDashboardPage;
