import React, { useEffect, useState } from 'react';
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
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
  FormFeedback,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { warehousesAPI, Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '../../../api/warehouses';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const Warehouses: React.FC = () => {
  document.title = 'Warehouses | Hazel Inventory';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load warehouses');
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingWarehouse?.name || '',
      location: editingWarehouse?.location || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Warehouse name is required'),
      location: Yup.string().required('Warehouse location is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        if (editingWarehouse) {
          const data: UpdateWarehouseDto = {
            name: values.name,
            location: values.location,
          };
          await warehousesAPI.updateWarehouse(editingWarehouse.id, data);
          toast.success('Warehouse updated successfully');
        } else {
          const data: CreateWarehouseDto = {
            name: values.name,
            location: values.location,
          };
          await warehousesAPI.createWarehouse(data);
          toast.success('Warehouse created successfully');
        }
        setIsModalOpen(false);
        setEditingWarehouse(null);
        validation.resetForm();
        loadWarehouses();
      } catch (error) {
        console.error('Failed to save warehouse:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save warehouse');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) {
      return;
    }

    setDeletingId(id);
    try {
      await warehousesAPI.deleteWarehouse(id);
      toast.success('Warehouse deleted successfully');
      loadWarehouses();
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete warehouse');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Warehouses" pageTitle="Inventory" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Warehouses</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => {
                      setEditingWarehouse(null);
                      setIsModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Warehouse
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading warehouses...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadWarehouses}>
                        Retry
                      </Button>
                    </div>
                  ) : warehouses.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="archive" size={64} />
                      </div>
                      <h5>No Warehouses Found</h5>
                      <p className="text-muted">Get started by creating your first warehouse.</p>
                      <Button
                        color="primary"
                        onClick={() => {
                          setEditingWarehouse(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Warehouse
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Location</th>
                            <th scope="col">Inventory Items</th>
                            <th scope="col">Fulfillments</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouses.map((warehouse) => (
                            <tr key={warehouse.id}>
                              <td>
                                <strong>{warehouse.name}</strong>
                              </td>
                              <td>
                                <span className="text-muted">{warehouse.location}</span>
                              </td>
                              <td>{warehouse._count?.inventoryItems || 0}</td>
                              <td>{warehouse._count?.fulfillments || 0}</td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(warehouse)}
                                  disabled={submitting || deletingId !== null}
                                >
                                  <FeatherIcon icon="edit" size={14} />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => handleDelete(warehouse.id)}
                                  disabled={submitting || deletingId === warehouse.id || deletingId !== null}
                                >
                                  {deletingId === warehouse.id ? (
                                    <Spinner size="sm" />
                                  ) : (
                                    <FeatherIcon icon="trash-2" size={14} />
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
        </Container>
      </div>

      <Modal isOpen={isModalOpen} toggle={handleModalClose} size="lg">
        <ModalHeader toggle={handleModalClose}>
          {editingWarehouse ? 'Edit Warehouse' : 'Create Warehouse'}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="name" className="form-label">
                Warehouse Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter warehouse name"
                value={validation.values.name}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                invalid={validation.touched.name && !!validation.errors.name}
                disabled={submitting}
              />
              {validation.touched.name && validation.errors.name && (
                <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="location" className="form-label">
                Location <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="location"
                name="location"
                placeholder="Enter warehouse location"
                value={validation.values.location}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                invalid={validation.touched.location && !!validation.errors.location}
                disabled={submitting}
              />
              {validation.touched.location && validation.errors.location && (
                <FormFeedback type="invalid">{validation.errors.location}</FormFeedback>
              )}
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={handleModalClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={submitting || !validation.isValid}
              >
                {submitting ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default Warehouses;

