import React, { useState } from 'react';
import { Row, Col, Label, Input, FormFeedback, Button, Spinner } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ProductWithVariants, productsAPI, UpdateProductDto } from '../../../api/products';
import { collectionsAPI } from '../../../api/collections';
import { uploadAPI } from '../../../api/upload';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

interface ProductInfoTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const ProductInfoTab: React.FC<ProductInfoTabProps> = ({ product, onReload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(product.imageUrl || '');
  const [collections, setCollections] = useState<any[]>([]);

  React.useEffect(() => {
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
      name: product.name,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      collectionId: product.collection?.id || '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Product name is required'),
      description: Yup.string(),
      imageUrl: Yup.string(),
      collectionId: Yup.string(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const updateData: UpdateProductDto = {
          name: values.name,
          description: values.description || undefined,
          imageUrl: values.imageUrl || undefined,
          collectionId: values.collectionId || undefined,
        };
        await productsAPI.updateProduct(product.id, updateData);
        toast.success('Product updated successfully');
        setIsEditing(false);
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update product');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const response = await uploadAPI.uploadProductImage(file, product.id);
      validation.setFieldValue('imageUrl', response.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isEditing) {
    return (
      <Row>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Product Name</Label>
            <p>{product.name}</p>
          </div>
        </Col>
        <Col md={12}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Description</Label>
            <p>{product.description || '-'}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Image</Label>
            {product.imageUrl ? (
              <div className="mt-2">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  className="rounded"
                />
              </div>
            ) : (
              <p className="text-muted">No image</p>
            )}
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Collection</Label>
            <p>{product.collection?.name || '-'}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Lifecycle Status</Label>
            <p>{product.lifecycleStatus}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Created At</Label>
            <p>{new Date(product.createdAt).toLocaleString()}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Updated At</Label>
            <p>{new Date(product.updatedAt).toLocaleString()}</p>
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Total Variants</Label>
            <p>{product.variants?.length || 0}</p>
          </div>
        </Col>
        <Col md={12}>
          <Button color="primary" onClick={() => setIsEditing(true)}>
            <FeatherIcon icon="edit" size={14} className="me-1" />
            Edit Product
          </Button>
        </Col>
      </Row>
    );
  }

  return (
    <form onSubmit={validation.handleSubmit}>
      <Row>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">
              Product Name <span className="text-danger">*</span>
            </Label>
            <Input
              type="text"
              name="name"
              value={validation.values.name}
              onChange={validation.handleChange}
              invalid={validation.touched.name && validation.errors.name ? true : false}
            />
            {validation.touched.name && validation.errors.name && (
              <FormFeedback type="invalid">{validation.errors.name}</FormFeedback>
            )}
          </div>
        </Col>
        <Col md={12}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Description</Label>
            <Input
              type="textarea"
              rows={4}
              name="description"
              value={validation.values.description}
              onChange={validation.handleChange}
            />
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Image</Label>
            {imagePreview && (
              <div className="mb-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  className="rounded"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            {uploadingImage && (
              <div className="mt-2">
                <Spinner size="sm" /> Uploading...
              </div>
            )}
            <Input
              type="hidden"
              name="imageUrl"
              value={validation.values.imageUrl}
            />
          </div>
        </Col>
        <Col md={6}>
          <div className="mb-3">
            <Label className="form-label fw-semibold">Collection</Label>
            <Input
              type="select"
              name="collectionId"
              value={validation.values.collectionId}
              onChange={validation.handleChange}
            >
              <option value="">None</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </Input>
          </div>
        </Col>
        <Col md={12}>
          <div className="d-flex gap-2">
            <Button type="submit" color="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <FeatherIcon icon="save" size={14} className="me-1" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              color="light"
              onClick={() => {
                setIsEditing(false);
                validation.resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </Col>
      </Row>
    </form>
  );
};

export default ProductInfoTab;

