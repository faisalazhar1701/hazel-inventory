import React, { useState } from 'react';
import { Table, Button, Badge, Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FeatherIcon from 'feather-icons-react';
import { ProductWithVariants, productsAPI, CreateProductVariantDto } from '../../../api/products';
import { toast } from 'react-toastify';

interface VariantsTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const VariantsTab: React.FC<VariantsTabProps> = ({ product, onReload }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      sku: '',
      attributes: '',
    },
    validationSchema: Yup.object({
      sku: Yup.string().required('SKU is required'),
      attributes: Yup.string(),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const data: CreateProductVariantDto = {
          sku: values.sku,
          attributes: values.attributes || undefined,
        };
        await productsAPI.createVariant(product.id, data);
        toast.success('Variant created successfully');
        setIsAddModalOpen(false);
        validation.resetForm();
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create variant');
      } finally {
        setLoading(false);
      }
    },
  });

  const parseAttributes = (attributes?: string) => {
    if (!attributes) return null;
    try {
      return JSON.parse(attributes);
    } catch {
      return null;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Product Variants</h6>
        <Button color="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <FeatherIcon icon="plus" size={14} className="me-1" />
          Add Variant
        </Button>
      </div>

      {product.variants && product.variants.length > 0 ? (
        <div className="table-responsive">
          <Table className="table-nowrap align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>SKU</th>
                <th>Attributes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => {
                const attrs = parseAttributes(variant.attributes);
                return (
                  <tr key={variant.id}>
                    <td>
                      <strong>{variant.sku}</strong>
                    </td>
                    <td>
                      {attrs ? (
                        <pre className="mb-0" style={{ fontSize: '12px' }}>
                          {JSON.stringify(attrs, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{new Date(variant.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">No variants found. Add your first variant.</p>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(false)}>
        <ModalHeader toggle={() => setIsAddModalOpen(false)}>Add Variant</ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
            <div className="mb-3">
              <Label className="form-label">SKU *</Label>
              <Input
                type="text"
                name="sku"
                value={validation.values.sku}
                onChange={validation.handleChange}
                invalid={validation.touched.sku && validation.errors.sku ? true : false}
              />
              {validation.touched.sku && validation.errors.sku && (
                <FormFeedback type="invalid">{validation.errors.sku}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Attributes (JSON)</Label>
              <Input
                type="textarea"
                rows={4}
                name="attributes"
                value={validation.values.attributes}
                onChange={validation.handleChange}
                placeholder='{"size": "M", "color": "Blue"}'
              />
              <small className="text-muted">Enter attributes as JSON string</small>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button type="button" color="light" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Variant'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default VariantsTab;

