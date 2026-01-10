import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Button,
  Spinner,
  Badge,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormFeedback,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { customersAPI, Customer, CustomerType, CustomerStatus, CreateCustomerDto, UpdateCustomerDto } from '../../../api/customers';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const CustomerList: React.FC = () => {
  document.title = 'Customers | Hazel Inventory';
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersAPI.listCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const createValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      type: CustomerType.RETAIL,
      companyName: '',
      status: CustomerStatus.ACTIVE,
    },
    validationSchema: Yup.object({
      type: Yup.string().required('Type is required'),
      companyName: Yup.string().required('Company name is required'),
      status: Yup.string().required('Status is required'),
    }),
    onSubmit: async (values) => {
      try {
        await customersAPI.createCustomer(values as CreateCustomerDto);
        toast.success('Customer created successfully');
        setCreateModal(false);
        createValidation.resetForm();
        loadCustomers();
      } catch (err) {
        console.error('Failed to create customer:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to create customer');
      }
    },
  });

  const editValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      companyName: selectedCustomer?.companyName || '',
      status: (selectedCustomer?.status as CustomerStatus) || CustomerStatus.ACTIVE,
    },
    validationSchema: Yup.object({
      companyName: Yup.string().required('Company name is required'),
      status: Yup.string().required('Status is required'),
    }),
    onSubmit: async (values) => {
      if (!selectedCustomer) return;
      try {
        await customersAPI.updateCustomer(selectedCustomer.id, values as UpdateCustomerDto);
        toast.success('Customer updated successfully');
        setEditModal(false);
        setSelectedCustomer(null);
        loadCustomers();
      } catch (err) {
        console.error('Failed to update customer:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to update customer');
      }
    },
  });

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await customersAPI.deleteCustomer(selectedCustomer.id);
      toast.success('Customer deleted successfully');
      setDeleteModal(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const getTypeBadgeColor = (type: CustomerType) => {
    switch (type) {
      case CustomerType.B2B:
        return 'info';
      case CustomerType.WHOLESALE:
        return 'warning';
      case CustomerType.RETAIL:
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeColor = (status: CustomerStatus) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return 'success';
      case CustomerStatus.INACTIVE:
        return 'secondary';
      case CustomerStatus.SUSPENDED:
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (typeFilter && customer.type !== typeFilter) return false;
    if (statusFilter && customer.status !== statusFilter) return false;
    return true;
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Customers" pageTitle="CRM" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Customers</h5>
                  <Button color="primary" className="btn-sm" onClick={() => setCreateModal(true)}>
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Customer
                  </Button>
                </CardHeader>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label className="form-label">Filter by Type</Label>
                      <Input
                        type="select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {Object.values(CustomerType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={4}>
                      <Label className="form-label">Filter by Status</Label>
                      <Input
                        type="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {Object.values(CustomerStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                      <Button
                        color="light"
                        onClick={() => {
                          setTypeFilter('');
                          setStatusFilter('');
                        }}
                        disabled={!typeFilter && !statusFilter}
                      >
                        Clear Filters
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading customers...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadCustomers}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="users" size={64} />
                      </div>
                      <h5>No Customers Found</h5>
                      <p className="text-muted">
                        {typeFilter || statusFilter
                          ? 'No customers match your filters.'
                          : 'No customers found. Create your first customer to get started.'}
                      </p>
                      {!typeFilter && !statusFilter && (
                        <Button color="primary" onClick={() => setCreateModal(true)}>
                          <FeatherIcon icon="plus" className="me-1" size={16} />
                          Create Customer
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Company Name</th>
                            <th scope="col">Type</th>
                            <th scope="col">Status</th>
                            <th scope="col">Orders</th>
                            <th scope="col">Users</th>
                            <th scope="col">Created At</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                              <td>
                                <strong>{customer.companyName}</strong>
                              </td>
                              <td>
                                <Badge color={getTypeBadgeColor(customer.type)}>
                                  {customer.type}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={getStatusBadgeColor(customer.status)}>
                                  {customer.status}
                                </Badge>
                              </td>
                              <td>{customer._count?.orders || 0}</td>
                              <td>{customer._count?.customerUsers || 0}</td>
                              <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                              <td className="text-end">
                                <div className="d-flex gap-2 justify-content-end">
                                  <Link to={`/customers/${customer.id}`}>
                                    <Button color="soft-primary" size="sm">
                                      <FeatherIcon icon="eye" size={14} />
                                    </Button>
                                  </Link>
                                  <Button
                                    color="soft-warning"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setEditModal(true);
                                    }}
                                  >
                                    <FeatherIcon icon="edit" size={14} />
                                  </Button>
                                  <Button
                                    color="soft-danger"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      setDeleteModal(true);
                                    }}
                                  >
                                    <FeatherIcon icon="trash-2" size={14} />
                                  </Button>
                                </div>
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

      {/* Create Modal */}
      <Modal isOpen={createModal} toggle={() => setCreateModal(false)}>
        <ModalHeader toggle={() => setCreateModal(false)}>Create Customer</ModalHeader>
        <form onSubmit={createValidation.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label">Type *</Label>
              <Input
                type="select"
                name="type"
                value={createValidation.values.type}
                onChange={createValidation.handleChange}
                invalid={createValidation.touched.type && !!createValidation.errors.type}
              >
                {Object.values(CustomerType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Input>
              {createValidation.touched.type && createValidation.errors.type && (
                <FormFeedback>{createValidation.errors.type}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Company Name *</Label>
              <Input
                type="text"
                name="companyName"
                value={createValidation.values.companyName}
                onChange={createValidation.handleChange}
                invalid={createValidation.touched.companyName && !!createValidation.errors.companyName}
              />
              {createValidation.touched.companyName && createValidation.errors.companyName && (
                <FormFeedback>{createValidation.errors.companyName}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Status *</Label>
              <Input
                type="select"
                name="status"
                value={createValidation.values.status}
                onChange={createValidation.handleChange}
                invalid={createValidation.touched.status && !!createValidation.errors.status}
              >
                {Object.values(CustomerStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Input>
              {createValidation.touched.status && createValidation.errors.status && (
                <FormFeedback>{createValidation.errors.status}</FormFeedback>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Create
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModal} toggle={() => setEditModal(false)}>
        <ModalHeader toggle={() => setEditModal(false)}>Edit Customer</ModalHeader>
        <form onSubmit={editValidation.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label">Company Name *</Label>
              <Input
                type="text"
                name="companyName"
                value={editValidation.values.companyName}
                onChange={editValidation.handleChange}
                invalid={editValidation.touched.companyName && !!editValidation.errors.companyName}
              />
              {editValidation.touched.companyName && editValidation.errors.companyName && (
                <FormFeedback>{editValidation.errors.companyName}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Status *</Label>
              <Input
                type="select"
                name="status"
                value={editValidation.values.status}
                onChange={editValidation.handleChange}
                invalid={editValidation.touched.status && !!editValidation.errors.status}
              >
                {Object.values(CustomerStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Input>
              {editValidation.touched.status && editValidation.errors.status && (
                <FormFeedback>{editValidation.errors.status}</FormFeedback>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Update
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)}>
        <ModalHeader toggle={() => setDeleteModal(false)}>Delete Customer</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete <strong>{selectedCustomer?.companyName}</strong>?</p>
          <p className="text-muted small">This action cannot be undone. Orders associated with this customer will not be deleted.</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default CustomerList;

