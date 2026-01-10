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
import { dropsAPI, Drop, CreateDropDto, UpdateDropDto } from '../../../api/drops';
import { collectionsAPI } from '../../../api/collections';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const Drops: React.FC = () => {
  document.title = 'Drops | Hazel Inventory';

  const [drops, setDrops] = useState<Drop[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDrops();
    loadCollections();
  }, []);

  const loadDrops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dropsAPI.listDrops();
      setDrops(data);
    } catch (err) {
      console.error('Failed to load drops:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drops');
      toast.error('Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      const data = await collectionsAPI.listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoadingCollections(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingDrop?.name || '',
      releaseDate: editingDrop?.releaseDate ? editingDrop.releaseDate.split('T')[0] : '',
      collectionId: editingDrop?.collectionId || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Drop name is required'),
      releaseDate: Yup.date(),
      collectionId: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        if (editingDrop) {
          const data: UpdateDropDto = {
            name: values.name,
            releaseDate: values.releaseDate || undefined,
            collectionId: values.collectionId || undefined,
          };
          await dropsAPI.updateDrop(editingDrop.id, data);
          toast.success('Drop updated successfully');
        } else {
          const data: CreateDropDto = {
            name: values.name,
            releaseDate: values.releaseDate || undefined,
            collectionId: values.collectionId || undefined,
          };
          await dropsAPI.createDrop(data);
          toast.success('Drop created successfully');
        }
        setIsModalOpen(false);
        setEditingDrop(null);
        validation.resetForm();
        loadDrops();
      } catch (error) {
        console.error('Failed to save drop:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save drop');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (drop: Drop) => {
    setEditingDrop(drop);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this drop?')) {
      return;
    }

    setDeletingId(id);
    try {
      await dropsAPI.deleteDrop(id);
      toast.success('Drop deleted successfully');
      loadDrops();
    } catch (error) {
      console.error('Failed to delete drop:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete drop');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDrop(null);
    validation.resetForm();
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Drops" pageTitle="Merchandising" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Drops</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => {
                      setEditingDrop(null);
                      setIsModalOpen(true);
                    }}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="plus" className="me-1" size={16} />
                    Create Drop
                  </Button>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading drops...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadDrops}>
                        Retry
                      </Button>
                    </div>
                  ) : drops.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="calendar" size={64} />
                      </div>
                      <h5>No Drops Found</h5>
                      <p className="text-muted">Get started by creating your first drop.</p>
                      <Button
                        color="primary"
                        onClick={() => {
                          setEditingDrop(null);
                          setIsModalOpen(true);
                        }}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Drop
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Collection</th>
                            <th scope="col">Release Date</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drops.map((drop) => (
                            <tr key={drop.id}>
                              <td>
                                <strong>{drop.name}</strong>
                              </td>
                              <td>
                                <span className="text-muted">
                                  {drop.collection?.name || '-'}
                                </span>
                              </td>
                              <td>
                                {drop.releaseDate
                                  ? new Date(drop.releaseDate).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEdit(drop)}
                                  disabled={submitting || deletingId !== null}
                                >
                                  <FeatherIcon icon="edit" size={14} />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => handleDelete(drop.id)}
                                  disabled={submitting || deletingId === drop.id || deletingId !== null}
                                >
                                  {deletingId === drop.id ? (
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
          {editingDrop ? 'Edit Drop' : 'Create Drop'}
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="name" className="form-label">
                Drop Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="Enter drop name"
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
              <Label htmlFor="releaseDate" className="form-label">
                Release Date
              </Label>
              <Input
                type="date"
                id="releaseDate"
                name="releaseDate"
                value={validation.values.releaseDate}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                disabled={submitting}
              />
            </div>
            <div className="mb-3">
              <Label htmlFor="collectionId" className="form-label">
                Collection
              </Label>
              <Input
                type="select"
                id="collectionId"
                name="collectionId"
                value={validation.values.collectionId}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                disabled={submitting || loadingCollections}
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} {collection.season ? `(${collection.season} ${collection.year || ''})`.trim() : ''}
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
                {submitting ? 'Saving...' : editingDrop ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default Drops;

