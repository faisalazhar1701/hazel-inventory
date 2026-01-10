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
import { brandsAPI, Brand, CreateBrandDto, UpdateBrandDto } from '../../../api/brands';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const Brands: React.FC = () => {
  document.title = 'Brands | Hazel Inventory';

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await brandsAPI.listBrands();
      setBrands(data);
    } catch (err) {
      console.error('Failed to load brands:', err);
      setError(err instanceof Error ? err.message : 'Failed to load brands');
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingBrand?.name || '',
      description: editingBrand?.description || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Brand name is required'),
      description: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        if (editingBrand) {
          const data: UpdateBrandDto = {
            name: values.name,
            description: values.description || undefined,
          };
          await brandsAPI.updateBrand(editingBrand.id, data);
          toast.success('Brand updated successfully');
        } else {
          const data: CreateBrandDto = {
            name: values.name,
            description: values.description || undefined,
          };
          await brandsAPI.createBrand(data);
          toast.success('Brand created successfully');
        }
        setIsModalOpen(false);
        setEditingBrand(null);
        validation.resetForm();
        loadBrands();
      } catch (error) {
        console.error('Failed to save brand:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save brand');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    setDeletingId(id);
    try {
      await brandsAPI.deleteBrand(id);
      toast.success('Brand deleted successfully');
      loadBrands();
    } catch (error) {
      console.error('Failed to delete brand:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete brand');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Brands" pageTitle="Merchandising" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Brands</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => {
                      setEditingBrand(null);
                      setIsModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Brand
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading brands...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadBrands}>
                        Retry
                      </Button>
                    </div>
                  ) : brands.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="tag" size={64} />
                      </div>
                      <h5>No Brands Found</h5>
                      <p className="text-muted">Get started by creating your first brand.</p>
                      <Button
                        color="primary"
                        onClick={() => {
                          setEditingBrand(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Brand
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Description</th>
                            <th scope="col">Products</th>
                            <th scope="col">Collections</th>
                            <th scope="col">Created</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brands.map((brand) => (
                            <tr key={brand.id}>
                              <td>
                                <strong>{brand.name}</strong>
                              </td>
                              <td>
                                <span className="text-muted">{brand.description || '-'}</span>
                              </td>
                              <td>{brand._count?.products || 0}</td>
                              <td>{brand._count?.collections || 0}</td>
                              <td>{new Date(brand.createdAt).toLocaleDateString()}</td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(brand)}
                                  disabled={submitting || deletingId !== null}
                                >
                                  <FeatherIcon icon="edit" size={14} />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => handleDelete(brand.id)}
                                  disabled={submitting || deletingId === brand.id || deletingId !== null}
                                >
                                  {deletingId === brand.id ? (
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
          {editingBrand ? 'Edit Brand' : 'Create Brand'}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="name" className="form-label">
                Brand Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter brand name"
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
              <Label htmlFor="description" className="form-label">
                Description
              </Label>
              <Input
                type="textarea"
                id="description"
                name="description"
                rows={3}
                placeholder="Enter brand description"
                value={validation.values.description}
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
                {submitting ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default Brands;

