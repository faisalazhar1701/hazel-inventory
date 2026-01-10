import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Form,
  Label,
  Input,
  FormFeedback,
  Button,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, CreateProductDto, ProductLifecycleStatus } from '../../../api/products';
import { toast } from 'react-toastify';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '',
      sku: '',
      description: '',
      lifecycleStatus: 'DRAFT' as ProductLifecycleStatus,
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Product name is required'),
      sku: Yup.string().required('SKU is required'),
      description: Yup.string(),
      lifecycleStatus: Yup.string()
        .oneOf(['DRAFT', 'ACTIVE', 'DISCONTINUED'], 'Invalid status')
        .required('Status is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const data: CreateProductDto = {
          name: values.name,
          sku: values.sku,
          description: values.description || undefined,
          lifecycleStatus: values.lifecycleStatus,
        };
        const product = await productsAPI.createProduct(data);
        toast.success('Product created successfully');
        navigate(`/products/${product.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create product');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Create Product" pageTitle="Products" />
          <Row>
            <Col lg={8}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Create New Product</h5>
                </CardHeader>
                <CardBody>
                  <Form onSubmit={validation.handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Product Name <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            name="name"
                            value={validation.values.name}
                            onChange={validation.handleChange}
                            invalid={validation.touched.name && validation.errors.name ? true : false}
                            placeholder="Enter product name"
                          />
                          {validation.touched.name && validation.errors.name && (
                            <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">
                            SKU <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            name="sku"
                            value={validation.values.sku}
                            onChange={validation.handleChange}
                            invalid={validation.touched.sku && validation.errors.sku ? true : false}
                            placeholder="Enter SKU"
                          />
                          {validation.touched.sku && validation.errors.sku && (
                            <FormFeedback type="invalid">{validation.errors.sku}</FormFeedback>
                          )}
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label className="form-label">Description</Label>
                          <Input
                            type="textarea"
                            rows={4}
                            name="description"
                            value={validation.values.description}
                            onChange={validation.handleChange}
                            placeholder="Enter product description"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Lifecycle Status <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="select"
                            name="lifecycleStatus"
                            value={validation.values.lifecycleStatus}
                            onChange={validation.handleChange}
                            invalid={
                              validation.touched.lifecycleStatus && validation.errors.lifecycleStatus ? true : false
                            }
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DISCONTINUED">Discontinued</option>
                          </Input>
                          {validation.touched.lifecycleStatus && validation.errors.lifecycleStatus && (
                            <FormFeedback type="invalid">{validation.errors.lifecycleStatus}</FormFeedback>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="button"
                        color="light"
                        onClick={() => navigate('/products')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" color="primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Product'}
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CreateProduct;

