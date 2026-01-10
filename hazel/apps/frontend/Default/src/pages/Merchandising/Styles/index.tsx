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
  Badge,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { stylesAPI, Style, CreateStyleDto, UpdateStyleDto } from '../../../api/styles';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const Styles: React.FC = () => {
  document.title = 'Styles | Hazel Inventory';

  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stylesAPI.listStyles();
      setStyles(data);
    } catch (err) {
      console.error('Failed to load styles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load styles');
      toast.error('Failed to load styles');
    } finally {
      setLoading(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingStyle?.name || '',
      code: editingStyle?.code || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Style name is required'),
      code: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        if (editingStyle) {
          const data: UpdateStyleDto = {
            name: values.name,
            code: values.code || undefined,
          };
          await stylesAPI.updateStyle(editingStyle.id, data);
          toast.success('Style updated successfully');
        } else {
          const data: CreateStyleDto = {
            name: values.name,
            code: values.code || undefined,
          };
          await stylesAPI.createStyle(data);
          toast.success('Style created successfully');
        }
        setIsModalOpen(false);
        setEditingStyle(null);
        validation.resetForm();
        loadStyles();
      } catch (error) {
        console.error('Failed to save style:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save style');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (style: Style) => {
    setEditingStyle(style);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this style?')) {
      return;
    }

    setDeletingId(id);
    try {
      await stylesAPI.deleteStyle(id);
      toast.success('Style deleted successfully');
      loadStyles();
    } catch (error) {
      console.error('Failed to delete style:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete style');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStyle(null);
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Styles" pageTitle="Merchandising" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Styles</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => {
                      setEditingStyle(null);
                      setIsModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Style
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading styles...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadStyles}>
                        Retry
                      </Button>
                    </div>
                  ) : styles.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="grid" size={64} />
                      </div>
                      <h5>No Styles Found</h5>
                      <p className="text-muted">Get started by creating your first style.</p>
                      <Button
                        color="primary"
                        onClick={() => {
                          setEditingStyle(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Style
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Code</th>
                            <th scope="col">Product</th>
                            <th scope="col">Status</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {styles.map((style) => (
                            <tr key={style.id}>
                              <td>
                                <strong>{style.name}</strong>
                              </td>
                              <td>
                                <span className="text-muted">{style.code || '-'}</span>
                              </td>
                              <td>
                                {style.product ? (
                                  <div>
                                    <div>{style.product.name}</div>
                                    <small className="text-muted">{style.product.sku}</small>
                                  </div>
                                ) : (
                                  <Badge color="soft-secondary">Unassigned</Badge>
                                )}
                              </td>
                              <td>
                                {style.productId ? (
                                  <Badge color="soft-success">Assigned</Badge>
                                ) : (
                                  <Badge color="soft-secondary">Available</Badge>
                                )}
                              </td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(style)}
                                  disabled={submitting || deletingId !== null}
                                >
                                  <FeatherIcon icon="edit" size={14} />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => handleDelete(style.id)}
                                  disabled={submitting || deletingId === style.id || deletingId !== null}
                                >
                                  {deletingId === style.id ? (
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
          {editingStyle ? 'Edit Style' : 'Create Style'}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="name" className="form-label">
                Style Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter style name"
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
              <Label htmlFor="code" className="form-label">
                Style Code
              </Label>
              <Input
                type="text"
                id="code"
                name="code"
                placeholder="Enter style code"
                value={validation.values.code}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                disabled={submitting}
              />
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
                {submitting ? 'Saving...' : editingStyle ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default Styles;

