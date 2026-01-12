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
import { analyticsAPI, FulfillmentPerformance, WarehouseFulfillment } from '../../../api/analytics';
import { warehousesAPI } from '../../../api/warehouses';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const FulfillmentAnalytics: React.FC = () => {
  document.title = 'Fulfillment Intelligence | Hazel Inventory';

  const [performance, setPerformance] = useState<FulfillmentPerformance | null>(null);
  const [warehouseFulfillment, setWarehouseFulfillment] = useState<WarehouseFulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
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
      if (channelFilter) filters.channel = channelFilter;
      if (warehouseFilter) filters.warehouseId = warehouseFilter;
      
      const [performanceData, warehouseData] = await Promise.all([
        analyticsAPI.getFulfillmentPerformance(filters),
        analyticsAPI.getWarehouseFulfillment(filters),
      ]);
      
      setPerformance(performanceData);
      setWarehouseFulfillment(warehouseData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      toast.error('Failed to load analytics data');
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
    setWarehouseFilter('');
    setTimeout(() => {
      loadData();
    }, 0);
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    return `${(hours / 24).toFixed(1)}d`;
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
          <BreadCrumb title="Fulfillment Intelligence" pageTitle="Analytics" />
          
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
                    <Col md={2}>
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
                    <Col md={2}>
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
                    <Col md={2} className="d-flex align-items-end gap-2">
                      <Button
                        color="primary"
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="btn-sm"
                      >
                        <FeatherIcon icon="filter" className="me-1" size={14} />
                        Filter
                      </Button>
                      <Button
                        color="light"
                        onClick={handleClearFilters}
                        disabled={loading}
                        className="btn-sm"
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
                      <p className="mt-2">Loading analytics data...</p>
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
          ) : performance ? (
            <>
              <Row className="mb-4">
                {/* Average Fulfillment Time */}
                <Col xl={3} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Avg Fulfillment Time</p>
                          <h4 className="mb-0 mt-2">
                            {formatHours(performance.averageFulfillmentTimeHours)}
                          </h4>
                          <small className="text-muted">Confirmed → Fulfilled</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className="avatar-title bg-info-subtle rounded fs-2">
                              <FeatherIcon icon="clock" className="text-info" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Fulfillment Rate */}
                <Col xl={3} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Fulfillment Rate</p>
                          <h4 className={`mb-0 mt-2 ${performance.fulfillmentRate >= 90 ? 'text-success' : performance.fulfillmentRate >= 75 ? 'text-warning' : 'text-danger'}`}>
                            {performance.fulfillmentRate.toFixed(1)}%
                          </h4>
                          <small className="text-muted">Orders fulfilled</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${performance.fulfillmentRate >= 90 ? 'bg-success-subtle' : performance.fulfillmentRate >= 75 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="check-circle" className={performance.fulfillmentRate >= 90 ? 'text-success' : performance.fulfillmentRate >= 75 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Cancellation Rate */}
                <Col xl={3} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Cancellation Rate</p>
                          <h4 className={`mb-0 mt-2 ${performance.cancellationRate < 5 ? 'text-success' : performance.cancellationRate < 10 ? 'text-warning' : 'text-danger'}`}>
                            {performance.cancellationRate.toFixed(1)}%
                          </h4>
                          <small className="text-muted">Orders cancelled</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${performance.cancellationRate < 5 ? 'bg-success-subtle' : performance.cancellationRate < 10 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="x-circle" className={performance.cancellationRate < 5 ? 'text-success' : performance.cancellationRate < 10 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Return Rate */}
                <Col xl={3} md={6}>
                  <Card className="card-height-100">
                    <CardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <p className="text-uppercase fw-medium text-muted mb-0">Return Rate</p>
                          <h4 className={`mb-0 mt-2 ${performance.returnRate < 5 ? 'text-success' : performance.returnRate < 10 ? 'text-warning' : 'text-danger'}`}>
                            {performance.returnRate.toFixed(1)}%
                          </h4>
                          <small className="text-muted">Orders returned</small>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="avatar-sm">
                            <span className={`avatar-title rounded fs-2 ${performance.returnRate < 5 ? 'bg-success-subtle' : performance.returnRate < 10 ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                              <FeatherIcon icon="rotate-ccw" className={performance.returnRate < 5 ? 'text-success' : performance.returnRate < 10 ? 'text-warning' : 'text-danger'} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Fulfillment Performance by Channel */}
              <Row className="mb-4">
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Fulfillment Performance by Channel</h5>
                    </CardHeader>
                    <CardBody>
                      {performance.byChannel.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="text-muted mb-3">
                            <FeatherIcon icon="inbox" size={64} />
                          </div>
                          <h5>No Data Available</h5>
                          <p className="text-muted">No fulfillment data found for the selected filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Channel</th>
                                <th scope="col" className="text-end">Avg Fulfillment Time</th>
                                <th scope="col" className="text-end">Fulfillment Rate</th>
                                <th scope="col" className="text-end">Cancellation Rate</th>
                                <th scope="col" className="text-end">Return Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {performance.byChannel.map((item) => (
                                <tr key={item.channel}>
                                  <td>
                                    <Badge color={getChannelBadgeColor(item.channel)}>
                                      {item.channel}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatHours(item.averageFulfillmentTimeHours)}
                                  </td>
                                  <td className="text-end">
                                    <Badge color={item.fulfillmentRate >= 90 ? 'success' : item.fulfillmentRate >= 75 ? 'warning' : 'danger'}>
                                      {item.fulfillmentRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="text-end">
                                    <Badge color={item.cancellationRate < 5 ? 'success' : item.cancellationRate < 10 ? 'warning' : 'danger'}>
                                      {item.cancellationRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="text-end">
                                    <Badge color={item.returnRate < 5 ? 'success' : item.returnRate < 10 ? 'warning' : 'danger'}>
                                      {item.returnRate.toFixed(1)}%
                                    </Badge>
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

              {/* Warehouse Fulfillment Summary */}
              <Row>
                <Col>
                  <Card>
                    <CardHeader>
                      <h5 className="card-title mb-0">Warehouse Fulfillment Summary</h5>
                    </CardHeader>
                    <CardBody>
                      {warehouseFulfillment.length === 0 ? (
                        <div className="text-center py-5">
                          <div className="text-muted mb-3">
                            <FeatherIcon icon="package" size={64} />
                          </div>
                          <h5>No Data Available</h5>
                          <p className="text-muted">No warehouse fulfillment data found for the selected filters.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-nowrap align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Warehouse</th>
                                <th scope="col" className="text-end">Orders Fulfilled</th>
                                <th scope="col" className="text-end">Inventory Movements</th>
                                <th scope="col" className="text-end">Avg Fulfillment Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {warehouseFulfillment.map((item) => (
                                <tr key={item.warehouseId}>
                                  <td>
                                    <div className="fw-medium">{item.warehouseName}</div>
                                  </td>
                                  <td className="text-end">
                                    <Badge color="info" className="fs-6">
                                      {item.ordersFulfilled.toLocaleString()}
                                    </Badge>
                                  </td>
                                  <td className="text-end">
                                    <Badge color="secondary" className="fs-6">
                                      {item.inventoryMovements.toLocaleString()}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatHours(item.averageFulfillmentTimeHours)}
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
                      <h5>No Analytics Data Available</h5>
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

export default FulfillmentAnalytics;
