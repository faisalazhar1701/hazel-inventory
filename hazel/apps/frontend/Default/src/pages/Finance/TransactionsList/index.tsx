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
import { Link } from 'react-router-dom';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { financeAPI, FinancialTransaction } from '../../../api/finance';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const TransactionsList: React.FC = () => {
  document.title = 'Financial Transactions | Hazel Inventory';

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [orderIdFilter, setOrderIdFilter] = useState<string>('');
  const [customerIdFilter, setCustomerIdFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (orderIdFilter) params.orderId = orderIdFilter;
      if (customerIdFilter) params.customerId = customerIdFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      
      const data = await financeAPI.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadTransactions();
  };

  const handleClearFilters = () => {
    setOrderIdFilter('');
    setCustomerIdFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setTimeout(() => {
      loadTransactions();
    }, 0);
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccountTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'ASSET':
        return 'success';
      case 'LIABILITY':
        return 'danger';
      case 'EQUITY':
        return 'info';
      case 'REVENUE':
        return 'primary';
      case 'EXPENSE':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getReferenceTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'ORDER':
        return 'primary';
      case 'INVENTORY':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Financial Transactions" pageTitle="Finance & Accounting" />
          
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Financial Transactions</h5>
                </CardHeader>
                <CardBody>
                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={3}>
                      <Label className="form-label">Order ID</Label>
                      <Input
                        type="text"
                        placeholder="Filter by Order ID"
                        value={orderIdFilter}
                        onChange={(e) => setOrderIdFilter(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label className="form-label">Customer ID</Label>
                      <Input
                        type="text"
                        placeholder="Filter by Customer ID"
                        value={customerIdFilter}
                        onChange={(e) => setCustomerIdFilter(e.target.value)}
                      />
                    </Col>
                    <Col md={2}>
                      <Label className="form-label">Start Date</Label>
                      <Input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                      />
                    </Col>
                    <Col md={2}>
                      <Label className="form-label">End Date</Label>
                      <Input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                      />
                    </Col>
                    <Col md={2} className="d-flex align-items-end gap-2">
                      <Button
                        color="primary"
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="btn-sm"
                      >
                        <FeatherIcon icon="search" className="me-1" size={14} />
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

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading transactions...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadTransactions}>
                        Retry
                      </Button>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="file-text" size={64} />
                      </div>
                      <h5>No Transactions Found</h5>
                      <p className="text-muted">
                        {orderIdFilter || customerIdFilter || startDateFilter || endDateFilter
                          ? 'No transactions match your filters.'
                          : 'No financial transactions found. Transactions will appear here once orders are fulfilled.'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Reference Type</th>
                            <th scope="col">Reference ID</th>
                            <th scope="col">Debit Account</th>
                            <th scope="col">Credit Account</th>
                            <th scope="col" className="text-end">Amount</th>
                            <th scope="col">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td>{formatDate(transaction.createdAt)}</td>
                              <td>
                                <Badge color={getReferenceTypeBadgeColor(transaction.referenceType)}>
                                  {transaction.referenceType}
                                </Badge>
                              </td>
                              <td>
                                {transaction.referenceType === 'ORDER' ? (
                                  <Link to={`/orders/${transaction.referenceId}`} className="fw-medium">
                                    {transaction.referenceId}
                                  </Link>
                                ) : (
                                  <span>{transaction.referenceId}</span>
                                )}
                              </td>
                              <td>
                                {transaction.debitAccount ? (
                                  <div>
                                    <div className="fw-medium">{transaction.debitAccount.name}</div>
                                    <div className="text-muted small">
                                      <Badge color={getAccountTypeBadgeColor(transaction.debitAccount.type)} className="me-1">
                                        {transaction.debitAccount.code}
                                      </Badge>
                                      <Badge color="soft-secondary">
                                        {transaction.debitAccount.type}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                              <td>
                                {transaction.creditAccount ? (
                                  <div>
                                    <div className="fw-medium">{transaction.creditAccount.name}</div>
                                    <div className="text-muted small">
                                      <Badge color={getAccountTypeBadgeColor(transaction.creditAccount.type)} className="me-1">
                                        {transaction.creditAccount.code}
                                      </Badge>
                                      <Badge color="soft-secondary">
                                        {transaction.creditAccount.type}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                              <td className="text-end fw-medium">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </td>
                              <td>
                                <Badge color="soft-info">{transaction.currency}</Badge>
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
        </Container>
      </div>
    </React.Fragment>
  );
};

export default TransactionsList;
