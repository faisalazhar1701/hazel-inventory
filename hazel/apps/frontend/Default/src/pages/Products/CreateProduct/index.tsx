import React, { useState, useEffect } from 'react';
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
  Spinner,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, CreateProductDto, ProductLifecycleStatus, CreateProductVariantDto } from '../../../api/products';
import { collectionsAPI } from '../../../api/collections';
import { uploadAPI } from '../../../api/upload';
import { toast } from 'react-toastify';
import VariantBuilder, { VariantOption } from '../Components/VariantBuilder';
import FeatherIcon from 'feather-icons-react';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await collectionsAPI.listCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '',
      description: '',
      collectionId: '',
      lifecycleStatus: 'DRAFT' as ProductLifecycleStatus,
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Product name is required'),
      description: Yup.string(),
      collectionId: Yup.string(),
      lifecycleStatus: Yup.string()
        .oneOf(['DRAFT', 'ACTIVE', 'DISCONTINUED'], 'Invalid status')
        .required('Status is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Step 1: Create product
        const productData: CreateProductDto = {
          name: values.name,
          description: values.description || undefined,
          imageUrl: imageUrl || undefined,
          lifecycleStatus: values.lifecycleStatus,
          collectionId: values.collectionId || undefined,
        };
        const product = await productsAPI.createProduct(productData);

        // Step 2: Create variants
        if (variants.length > 0) {
          for (const variant of variants) {
            if (variant.status === 'Active') {
              try {
                const variantData: CreateProductVariantDto = {
                  color: variant.color,
                  size: variant.size,
                  price: variant.price || 0,
                  status: variant.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
                };
                await productsAPI.createVariant(product.id, variantData);
              } catch (error) {
                console.error('Failed to create variant:', error);
                toast.warning(`Failed to create variant ${variant.color}/${variant.size}`);
              }
            }
          }
        }

        toast.success('Product created successfully');
        navigate(`/products/${product.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create product');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    try {
      const response = await uploadAPI.uploadProductImage(file);
      setImageUrl(response.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Create Product" pageTitle="Products" />
          <Form onSubmit={validation.handleSubmit}>
            <Row>
              <Col lg={12}>
                {/* Section 1: Basic Info */}
                <Card className="mb-3">
                  <CardHeader>
                    <h5 className="card-title mb-0">Basic Information</h5>
                  </CardHeader>
                  <CardBody>
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
                            SKU
                          </Label>
                          <Input
                            type="text"
                            name="sku"
                            value=""
                            readOnly
                            disabled
                            placeholder="Variant SKUs will be generated automatically"
                          />
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
                          <Label className="form-label">Collection</Label>
                          <Input
                            type="select"
                            name="collectionId"
                            value={validation.values.collectionId}
                            onChange={validation.handleChange}
                          >
                            <option value="">Select a collection</option>
                            {collections.map((collection) => (
                              <option key={collection.id} value={collection.id}>
                                {collection.name}
                              </option>
                            ))}
                          </Input>
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
                  </CardBody>
                </Card>

                {/* Section 2: Variants */}
                <Card className="mb-3">
                  <VariantBuilder
                    productCode={validation.values.name || 'PROD'}
                    variants={variants}
                    onVariantsChange={setVariants}
                  />
                </Card>

                {/* Section 3: BOM (Optional) */}
                <Card className="mb-3">
                  <CardHeader>
                    <h5 className="card-title mb-0">Bill of Materials (Optional)</h5>
                    <p className="text-muted mb-0 small">Add components and materials needed for this product</p>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-4">
                      <p className="text-muted">
                        BOM components can be added after product creation in the product detail page.
                      </p>
                    </div>
                  </CardBody>
                </Card>

                {/* Section 4: Images */}
                <Card className="mb-3">
                  <CardHeader>
                    <h5 className="card-title mb-0">Product Images</h5>
                  </CardHeader>
                  <CardBody>
                    <div className="mb-3">
                      <Label className="form-label">Upload Product Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="mt-2">
                          <Spinner size="sm" className="me-2" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-3">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                          className="img-thumbnail"
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Submit Button */}
                <div className="d-flex justify-content-end gap-2 mb-4">
                  <Button
                    type="button"
                    color="light"
                    onClick={() => navigate('/products')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FeatherIcon icon="check" size={16} className="me-1" />
                        Create Product
                      </>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CreateProduct;
