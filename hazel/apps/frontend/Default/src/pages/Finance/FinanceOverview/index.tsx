import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Spinner,
  Button,
  Input,
  Label,
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { financeAPI, FinancialTransaction } from '../../../api/finance';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const FinanceOverview: React.FC = () => {
  document.title = 'Finance Overview | Hazel Inventory';

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const data = await financeAPI.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    loadTransactions();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    // Reload after clearing
    setTimeout(() => {
      loadTransactions();
    }, 0);
  };

  // Calculate metrics from transactions
  const calculateMetrics = () => {
    let totalRevenue = 0;
    let totalCOGS = 0;

    transactions.forEach((transaction) => {
      // Revenue transactions: credit account is REVENUE
      if (transaction.creditAccount?.code === 'REVENUE') {
        totalRevenue += transaction.amount;
      }
      // COGS transactions: debit account is COGS
      if (transaction.debitAccount?.code === 'COGS') {
        totalCOGS += transaction.amount;
      }
    });

    const grossMargin = totalRevenue - totalCOGS;
    const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCOGS,
      grossMargin,
      grossMarginPercent,
    };
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const metrics = calculateMetrics();

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Finance Overview" pageTitle="Finance & Accounting" />
          
          {/* Date Range Filter */}
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
                    <Col md={6} className="d-flex align-items-end gap-2">
                      <Button
                        color="primary"
                        onClick={handleDateFilter}
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

          {/* Metrics Cards */}
          {loading ? (
            <Row>
              <Col>
                <Card>
                  <CardBody>
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading financial data...</p>
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
                      <Button color="primary" onClick={loadTransactions}>
                        Retry
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : (
            <Row>
              {/* Total Revenue */}
              <Col xl={3} md={6}>
                <Card className="card-height-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-uppercase fw-medium text-muted mb-0">Total Revenue</p>
                        <h4 className="mb-0 mt-2">
                          {formatCurrency(metrics.totalRevenue)}
                        </h4>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <span className="avatar-title bg-success-subtle rounded fs-2">
                            <FeatherIcon icon="trending-up" className="text-success" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Total COGS */}
              <Col xl={3} md={6}>
                <Card className="card-height-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-uppercase fw-medium text-muted mb-0">Total COGS</p>
                        <h4 className="mb-0 mt-2">
                          {formatCurrency(metrics.totalCOGS)}
                        </h4>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <span className="avatar-title bg-danger-subtle rounded fs-2">
                            <FeatherIcon icon="trending-down" className="text-danger" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Gross Margin */}
              <Col xl={3} md={6}>
                <Card className="card-height-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-uppercase fw-medium text-muted mb-0">Gross Margin</p>
                        <h4 className={`mb-0 mt-2 ${metrics.grossMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(metrics.grossMargin)}
                        </h4>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <span className={`avatar-title rounded fs-2 ${metrics.grossMargin >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                            <FeatherIcon icon="dollar-sign" className={metrics.grossMargin >= 0 ? 'text-success' : 'text-danger'} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Gross Margin %} */}
              <Col xl={3} md={6}>
                <Card className="card-height-100">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <p className="text-uppercase fw-medium text-muted mb-0">Gross Margin %</p>
                        <h4 className={`mb-0 mt-2 ${metrics.grossMarginPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                          {metrics.grossMarginPercent.toFixed(2)}%
                        </h4>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="avatar-sm">
                          <span className={`avatar-title rounded fs-2 ${metrics.grossMarginPercent >= 0 ? 'bg-info-subtle' : 'bg-danger-subtle'}`}>
                            <FeatherIcon icon="percent" className={metrics.grossMarginPercent >= 0 ? 'text-info' : 'text-danger'} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {/* Empty State */}
          {!loading && !error && transactions.length === 0 && (
            <Row>
              <Col>
                <Card>
                  <CardBody>
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="bar-chart-2" size={64} />
                      </div>
                      <h5>No Financial Data Available</h5>
                      <p className="text-muted">
                        {startDate || endDate
                          ? 'No transactions found for the selected date range.'
                          : 'No financial transactions found. Transactions will appear here once orders are fulfilled.'}
                      </p>
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

export default FinanceOverview;
