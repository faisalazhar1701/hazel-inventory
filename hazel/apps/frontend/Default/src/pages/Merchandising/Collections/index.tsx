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
import { collectionsAPI, Collection, CreateCollectionDto, UpdateCollectionDto } from '../../../api/collections';
import { brandsAPI } from '../../../api/brands';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const Collections: React.FC = () => {
  document.title = 'Collections | Hazel Inventory';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
    loadBrands();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collectionsAPI.listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await brandsAPI.listBrands();
      setBrands(data);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingCollection?.name || '',
      season: editingCollection?.season || '',
      year: editingCollection?.year?.toString() || '',
      brandId: editingCollection?.brandId || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Collection name is required'),
      season: Yup.string(),
      year: Yup.number().min(1900, 'Year must be at least 1900'),
      brandId: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        if (editingCollection) {
          const data: UpdateCollectionDto = {
            name: values.name,
            season: values.season || undefined,
            year: values.year ? parseInt(values.year) : undefined,
            brandId: values.brandId || undefined,
          };
          await collectionsAPI.updateCollection(editingCollection.id, data);
          toast.success('Collection updated successfully');
        } else {
          const data: CreateCollectionDto = {
            name: values.name,
            season: values.season || undefined,
            year: values.year ? parseInt(values.year) : undefined,
            brandId: values.brandId || undefined,
          };
          await collectionsAPI.createCollection(data);
          toast.success('Collection created successfully');
        }
        setIsModalOpen(false);
        setEditingCollection(null);
        validation.resetForm();
        loadCollections();
      } catch (error) {
        console.error('Failed to save collection:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save collection');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    setDeletingId(id);
    try {
      await collectionsAPI.deleteCollection(id);
      toast.success('Collection deleted successfully');
      loadCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Collections" pageTitle="Merchandising" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Collections</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => {
                      setEditingCollection(null);
                      setIsModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Collection
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading collections...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadCollections}>
                        Retry
                      </Button>
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="archive" size={64} />
                      </div>
                      <h5>No Collections Found</h5>
                      <p className="text-muted">Get started by creating your first collection.</p>
                      <Button
                        color="primary"
                        onClick={() => {
                          setEditingCollection(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Collection
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Brand</th>
                            <th scope="col">Season</th>
                            <th scope="col">Year</th>
                            <th scope="col">Products</th>
                            <th scope="col">Drops</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collections.map((collection) => (
                            <tr key={collection.id}>
                              <td>
                                <strong>{collection.name}</strong>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {collection.brand?.name || '-'}
                                </span>
                              </td>
                              <td>{collection.season || '-'}</td>
                              <td>{collection.year || '-'}</td>
                              <td>{collection._count?.products || 0}</td>
                              <td>{collection._count?.drops || 0}</td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(collection)}
                                  disabled={submitting || deletingId !== null}
                                >
                                  <FeatherIcon icon="edit" size={14} />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => handleDelete(collection.id)}
                                  disabled={submitting || deletingId === collection.id || deletingId !== null}
                                >
                                  {deletingId === collection.id ? (
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
          {editingCollection ? 'Edit Collection' : 'Create Collection'}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="name" className="form-label">
                Collection Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter collection name"
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
            <div className="row">
              <div className="col-md-6 mb-3">
                <Label htmlFor="season" className="form-label">
                  Season
                </Label>
                <Input
                  type="text"
                  id="season"
                  name="season"
                  placeholder="e.g., Spring, Summer, Fall, Winter"
                  value={validation.values.season}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  disabled={submitting}
                />
              </div>
              <div className="col-md-6 mb-3">
                <Label htmlFor="year" className="form-label">
                  Year
                </Label>
                <Input
                  type="number"
                  id="year"
                  name="year"
                  placeholder="e.g., 2024"
                  min="1900"
                  value={validation.values.year}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  invalid={validation.touched.year && !!validation.errors.year}
                  disabled={submitting}
                />
                {validation.touched.year && validation.errors.year && (
                  <FormFeedback type="invalid">{validation.errors.year}</FormFeedback>
                )}
              </div>
            </div>
            <div className="mb-3">
              <Label htmlFor="brandId" className="form-label">
                Brand
              </Label>
              <Input
                type="select"
                id="brandId"
                name="brandId"
                value={validation.values.brandId}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                disabled={submitting || loadingBrands}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Input>
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
                {submitting ? 'Saving...' : editingCollection ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default Collections;

