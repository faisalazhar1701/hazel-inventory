import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Button,
  Spinner,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  FormFeedback,
  Table,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import classNames from 'classnames';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { customersAPI, Customer, CustomerType, CustomerStatus } from '../../../api/customers';
import { customerUsersAPI, CustomerUser, CustomerUserRole, AssignCustomerUserDto, UpdateCustomerUserRoleDto } from '../../../api/customer-users';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [assignUserModal, setAssignUserModal] = useState(false);
  const [editRoleModal, setEditRoleModal] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (id) {
      document.title = `Customer ${id} | Hazel Inventory`;
      loadCustomer();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === '2') {
      loadCustomerUsers();
    }
  }, [id, activeTab]);

  const loadCustomer = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await customersAPI.getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      console.error('Failed to load customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer');
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerUsers = async () => {
    if (!id) return;
    try {
      setLoadingUsers(true);
      const users = await customerUsersAPI.listCustomerUsers(id);
      setCustomerUsers(users);
    } catch (err) {
      console.error('Failed to load customer users:', err);
      toast.error('Failed to load customer users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const assignUserValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      userId: '',
      role: CustomerUserRole.VIEWER,
    },
    validationSchema: Yup.object({
      userId: Yup.string().required('User ID is required'),
      role: Yup.string().required('Role is required'),
    }),
    onSubmit: async (values) => {
      if (!id) return;
      try {
        await customerUsersAPI.assignUserToCustomer(id, values as AssignCustomerUserDto);
        toast.success('User assigned successfully');
        setAssignUserModal(false);
        assignUserValidation.resetForm();
        loadCustomerUsers();
        loadCustomer(); // Refresh to update user count
      } catch (err) {
        console.error('Failed to assign user:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to assign user');
      }
    },
  });

  const editRoleValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      role: selectedUser?.role || CustomerUserRole.VIEWER,
    },
    validationSchema: Yup.object({
      role: Yup.string().required('Role is required'),
    }),
    onSubmit: async (values) => {
      if (!id || !selectedUser) return;
      try {
        await customerUsersAPI.updateCustomerUserRole(id, selectedUser.userId, values as UpdateCustomerUserRoleDto);
        toast.success('User role updated successfully');
        setEditRoleModal(false);
        setSelectedUser(null);
        loadCustomerUsers();
      } catch (err) {
        console.error('Failed to update user role:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to update user role');
      }
    },
  });

  const handleDeleteUser = async () => {
    if (!id || !selectedUser) return;
    try {
      await customerUsersAPI.removeUserFromCustomer(id, selectedUser.userId);
      toast.success('User removed successfully');
      setDeleteUserModal(false);
      setSelectedUser(null);
      loadCustomerUsers();
      loadCustomer(); // Refresh to update user count
    } catch (err) {
      console.error('Failed to remove user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove user');
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

  const getRoleBadgeColor = (role: CustomerUserRole) => {
    switch (role) {
      case CustomerUserRole.ADMIN:
        return 'danger';
      case CustomerUserRole.MANAGER:
        return 'warning';
      case CustomerUserRole.VIEWER:
        return 'info';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="mt-2">Loading customer...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <div className="text-danger mb-2">
              <FeatherIcon icon="alert-circle" size={48} />
            </div>
            <p className="text-danger">{error || 'Customer not found'}</p>
            <Button color="primary" onClick={() => navigate('/customers')}>
              Back to Customers
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={`Customer: ${customer.companyName}`} pageTitle="CRM" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title mb-0">{customer.companyName}</h5>
                    <div className="mt-2">
                      <Badge color={getTypeBadgeColor(customer.type)} className="me-2">
                        {customer.type}
                      </Badge>
                      <Badge color={getStatusBadgeColor(customer.status)}>
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                  <Button color="secondary" onClick={() => navigate('/customers')}>
                    <FeatherIcon icon="arrow-left" className="me-1" size={16} />
                    Back
                  </Button>
                </CardHeader>
                <CardBody>
                  <Nav tabs className="nav-tabs-custom">
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '1' })}
                        onClick={() => setActiveTab('1')}
                      >
                        <FeatherIcon icon="info" className="me-1" size={16} />
                        Information
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '2' })}
                        onClick={() => setActiveTab('2')}
                      >
                        <FeatherIcon icon="users" className="me-1" size={16} />
                        Users ({customer._count?.customerUsers || 0})
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '3' })}
                        onClick={() => setActiveTab('3')}
                      >
                        <FeatherIcon icon="shopping-cart" className="me-1" size={16} />
                        Orders ({customer._count?.orders || 0})
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={activeTab} className="mt-4">
                    <TabPane tabId="1">
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Company Name</Label>
                            <p>{customer.companyName}</p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Type</Label>
                            <p>
                              <Badge color={getTypeBadgeColor(customer.type)}>
                                {customer.type}
                              </Badge>
                            </p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Status</Label>
                            <p>
                              <Badge color={getStatusBadgeColor(customer.status)}>
                                {customer.status}
                              </Badge>
                            </p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Total Orders</Label>
                            <p>{customer._count?.orders || 0}</p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Assigned Users</Label>
                            <p>{customer._count?.customerUsers || 0}</p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Created At</Label>
                            <p>{new Date(customer.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label fw-bold">Updated At</Label>
                            <p>{new Date(customer.updatedAt).toLocaleString()}</p>
                          </div>
                        </Col>
                      </Row>
                    </TabPane>

                    <TabPane tabId="2">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Assigned Users</h6>
                        <Button color="primary" size="sm" onClick={() => setAssignUserModal(true)}>
                          <FeatherIcon icon="plus" className="me-1" size={14} />
                          Assign User
                        </Button>
                      </div>

                      {loadingUsers ? (
                        <div className="text-center py-3">
                          <Spinner color="primary" size="sm" />
                        </div>
                      ) : customerUsers.length === 0 ? (
                        <div className="text-center py-4">
                          <FeatherIcon icon="users" size={48} className="text-muted mb-2" />
                          <p className="text-muted">No users assigned to this customer</p>
                        </div>
                      ) : (
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Assigned At</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerUsers.map((cu) => (
                              <tr key={cu.id}>
                                <td>{cu.user?.email || cu.userId}</td>
                                <td>
                                  <Badge color={getRoleBadgeColor(cu.role)}>
                                    {cu.role}
                                  </Badge>
                                </td>
                                <td>{new Date(cu.createdAt).toLocaleDateString()}</td>
                                <td className="text-end">
                                  <div className="d-flex gap-2 justify-content-end">
                                    <Button
                                      color="soft-warning"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(cu);
                                        setEditRoleModal(true);
                                      }}
                                    >
                                      <FeatherIcon icon="edit" size={14} />
                                    </Button>
                                    <Button
                                      color="soft-danger"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUser(cu);
                                        setDeleteUserModal(true);
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
                      )}
                    </TabPane>

                    <TabPane tabId="3">
                      <h6>Customer Orders</h6>
                      {customer.orders && customer.orders.length > 0 ? (
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Order Number</th>
                              <th>Status</th>
                              <th>Total Amount</th>
                              <th>Currency</th>
                              <th>Created At</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customer.orders.map((order) => (
                              <tr key={order.id}>
                                <td>
                                  <strong>{order.orderNumber}</strong>
                                </td>
                                <td>
                                  <Badge color="info">{order.status}</Badge>
                                </td>
                                <td>
                                  <strong>{order.totalAmount.toFixed(2)}</strong>
                                </td>
                                <td>{order.currency}</td>
                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                <td className="text-end">
                                  <Link to={`/orders/${order.id}`}>
                                    <Button color="soft-primary" size="sm">
                                      <FeatherIcon icon="eye" size={14} />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-center py-4">
                          <FeatherIcon icon="shopping-cart" size={48} className="text-muted mb-2" />
                          <p className="text-muted">No orders found for this customer</p>
                        </div>
                      )}
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Assign User Modal */}
      <Modal isOpen={assignUserModal} toggle={() => setAssignUserModal(false)}>
        <ModalHeader toggle={() => setAssignUserModal(false)}>Assign User to Customer</ModalHeader>
        <form onSubmit={assignUserValidation.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label">User ID *</Label>
              <Input
                type="text"
                name="userId"
                value={assignUserValidation.values.userId}
                onChange={assignUserValidation.handleChange}
                invalid={assignUserValidation.touched.userId && !!assignUserValidation.errors.userId}
                placeholder="Enter user ID"
              />
              {assignUserValidation.touched.userId && assignUserValidation.errors.userId && (
                <FormFeedback>{assignUserValidation.errors.userId}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Role *</Label>
              <Input
                type="select"
                name="role"
                value={assignUserValidation.values.role}
                onChange={assignUserValidation.handleChange}
                invalid={assignUserValidation.touched.role && !!assignUserValidation.errors.role}
              >
                {Object.values(CustomerUserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Input>
              {assignUserValidation.touched.role && assignUserValidation.errors.role && (
                <FormFeedback>{assignUserValidation.errors.role}</FormFeedback>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setAssignUserModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Assign
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={editRoleModal} toggle={() => setEditRoleModal(false)}>
        <ModalHeader toggle={() => setEditRoleModal(false)}>Update User Role</ModalHeader>
        <form onSubmit={editRoleValidation.handleSubmit}>
          <ModalBody>
            <div className="mb-3">
              <Label className="form-label">User</Label>
              <Input type="text" value={selectedUser?.user?.email || selectedUser?.userId || ''} disabled />
            </div>
            <div className="mb-3">
              <Label className="form-label">Role *</Label>
              <Input
                type="select"
                name="role"
                value={editRoleValidation.values.role}
                onChange={editRoleValidation.handleChange}
                invalid={editRoleValidation.touched.role && !!editRoleValidation.errors.role}
              >
                {Object.values(CustomerUserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Input>
              {editRoleValidation.touched.role && editRoleValidation.errors.role && (
                <FormFeedback>{editRoleValidation.errors.role}</FormFeedback>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditRoleModal(false)}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Update
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={deleteUserModal} toggle={() => setDeleteUserModal(false)}>
        <ModalHeader toggle={() => setDeleteUserModal(false)}>Remove User from Customer</ModalHeader>
        <ModalBody>
          <p>Are you sure you want to remove <strong>{selectedUser?.user?.email || selectedUser?.userId}</strong> from this customer?</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteUserModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDeleteUser}>
            Remove
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default CustomerDetail;

