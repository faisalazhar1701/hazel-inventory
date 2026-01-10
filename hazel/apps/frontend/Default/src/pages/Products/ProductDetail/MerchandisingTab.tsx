import React, { useState, useEffect } from 'react';
import { Form, Label, Input, Button, FormFeedback, Spinner, Badge, Alert, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FeatherIcon from 'feather-icons-react';
import { ProductWithVariants, productsAPI, AssignProductRelationsDto } from '../../../api/products';
import { collectionsAPI } from '../../../api/collections';
import { stylesAPI, CreateStyleDto } from '../../../api/styles';
import { toast } from 'react-toastify';

interface MerchandisingTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const MerchandisingTab: React.FC<MerchandisingTabProps> = ({ product, onReload }) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateStyleModalOpen, setIsCreateStyleModalOpen] = useState(false);
  const [creatingStyle, setCreatingStyle] = useState(false);

  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      const allCollections = await collectionsAPI.listCollections();
      setCollections(allCollections);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoadingCollections(false);
    }
  };

  const loadStyles = async () => {
    try {
      setLoadingStyles(true);
      const data = await stylesAPI.listStyles();
      setStyles(data);
    } catch (error) {
      console.error('Failed to load styles:', error);
      toast.error('Failed to load styles');
    } finally {
      setLoadingStyles(false);
    }
  };

  useEffect(() => {
    loadCollections();
    loadStyles();
  }, []);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      collectionId: (product as any).collection?.id || '',
      styleId: (product as any).style?.id || '',
    },
    validationSchema: Yup.object({
      collectionId: Yup.string(),
      styleId: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const data: AssignProductRelationsDto = {
          collectionId: values.collectionId || undefined,
          styleId: values.styleId || undefined,
        };
        await productsAPI.assignRelations(product.id, data);
        toast.success('Merchandising information updated successfully');
        onReload();
        loadStyles(); // Reload styles to refresh assignment status
      } catch (error) {
        console.error('Failed to update merchandising information:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update merchandising information');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const styleValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '',
      code: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Style name is required'),
      code: Yup.string(),
    }),
    onSubmit: async (values) => {
      setCreatingStyle(true);
      try {
        const data: CreateStyleDto = {
          name: values.name,
          code: values.code || undefined,
          productId: product.id,
        };
        const newStyle = await stylesAPI.createStyle(data);
        toast.success('Style created and assigned successfully');
        setIsCreateStyleModalOpen(false);
        styleValidation.resetForm();
        await loadStyles();
        // Auto-assign the newly created style
        validation.setFieldValue('styleId', newStyle.id);
        await validation.submitForm();
      } catch (error) {
        console.error('Failed to create style:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create style');
      } finally {
        setCreatingStyle(false);
      }
    },
  });

  // Find available styles (not assigned or assigned to this product)
  const availableStyles = styles.filter((style) => !style.productId || style.productId === product.id);

  return (
    <div>
      <div className="mb-4">
        <h6 className="mb-3">Merchandising Information</h6>
        <Alert color="info" className="mb-3">
          Assign this product to a collection and style to organize your merchandise.
        </Alert>
      </div>

      <Form onSubmit={validation.handleSubmit}>
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
            <option value="">
              {collections.length === 0
                ? 'No collections found'
                : 'Select a collection'}
            </option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name} {collection.season ? `(${collection.season} ${collection.year || ''})`.trim() : ''}
              </option>
            ))}
          </Input>
          {(product as any).collection && (
            <div className="mt-2">
              <Badge color="soft-info">
                Current: {(product as any).collection.name}
                {(product as any).collection.season &&
                  ` (${(product as any).collection.season} ${(product as any).collection.year || ''})`.trim()}
              </Badge>
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Label htmlFor="styleId" className="form-label mb-0">
              Style
            </Label>
            <Button
              color="soft-primary"
              size="sm"
              type="button"
              onClick={() => setIsCreateStyleModalOpen(true)}
              disabled={submitting || creatingStyle}
            >
              <FeatherIcon icon="plus" size={14} className="me-1" />
              Create New Style
            </Button>
          </div>
          <Input
            type="select"
            id="styleId"
            name="styleId"
            value={validation.values.styleId}
            onChange={validation.handleChange}
            onBlur={validation.handleBlur}
            disabled={submitting || loadingStyles}
          >
            <option value="">Select a style</option>
            {availableStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name} {style.code ? `(${style.code})` : ''}
              </option>
            ))}
          </Input>
          {(product as any).style && (
            <div className="mt-2">
              <Badge color="soft-info">
                Current: {(product as any).style.name}
                {(product as any).style.code && ` (${(product as any).style.code})`}
              </Badge>
            </div>
          )}
          {availableStyles.length === 0 && (
            <div className="mt-2">
              <small className="text-muted">No available styles. Create a new style to assign.</small>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button
            type="submit"
            color="primary"
            disabled={submitting || !validation.isValid}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Form>

      {/* Create Style Modal */}
      <Modal isOpen={isCreateStyleModalOpen} toggle={() => setIsCreateStyleModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsCreateStyleModalOpen(false)}>
          Create New Style
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={styleValidation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="styleName" className="form-label">
                Style Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="styleName"
                name="name"
                placeholder="Enter style name"
                value={styleValidation.values.name}
                onChange={styleValidation.handleChange}
                onBlur={styleValidation.handleBlur}
                invalid={styleValidation.touched.name && !!styleValidation.errors.name}
                disabled={creatingStyle}
              />
              {styleValidation.touched.name && styleValidation.errors.name && (
                <FormFeedback type="invalid">{styleValidation.errors.name}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="styleCode" className="form-label">
                Style Code
              </Label>
              <Input
                type="text"
                id="styleCode"
                name="code"
                placeholder="Enter style code (optional)"
                value={styleValidation.values.code}
                onChange={styleValidation.handleChange}
                onBlur={styleValidation.handleBlur}
                disabled={creatingStyle}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={() => setIsCreateStyleModalOpen(false)}
                disabled={creatingStyle}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={creatingStyle || !styleValidation.isValid}
              >
                {creatingStyle ? 'Creating...' : 'Create & Assign'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default MerchandisingTab;

