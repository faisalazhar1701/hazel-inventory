import React, { useState } from 'react';
import { Button, Form, Label, Input, FormFeedback, Alert } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ProductWithVariants, productsAPI, ProductLifecycleStatus } from '../../../api/products';
import { toast } from 'react-toastify';

interface LifecycleTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const LifecycleTab: React.FC<LifecycleTabProps> = ({ product, onReload }) => {
  const [loading, setLoading] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      lifecycleStatus: product.lifecycleStatus,
    },
    validationSchema: Yup.object({
      lifecycleStatus: Yup.string()
        .oneOf(['DRAFT', 'ACTIVE', 'DISCONTINUED'], 'Invalid status')
        .required('Status is required'),
    }),
    onSubmit: async (values) => {
      if (values.lifecycleStatus === product.lifecycleStatus) {
        toast.info('Status unchanged');
        return;
      }

      setLoading(true);
      try {
        await productsAPI.updateLifecycleStatus(product.id, {
          lifecycleStatus: values.lifecycleStatus as ProductLifecycleStatus,
        });
        toast.success('Lifecycle status updated successfully');
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update lifecycle status');
      } finally {
        setLoading(false);
      }
    },
  });

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      DRAFT: 'Product is in draft stage and not yet active',
      ACTIVE: 'Product is active and available',
      DISCONTINUED: 'Product has been discontinued',
    };
    return descriptions[status] || '';
  };

  return (
    <div>
      <Alert color="info" className="mb-3">
        <strong>Current Status:</strong> {product.lifecycleStatus}
        <br />
        <small>{getStatusDescription(product.lifecycleStatus)}</small>
      </Alert>

      <Form onSubmit={validation.handleSubmit}>
        <div className="mb-3">
          <Label className="form-label">Lifecycle Status *</Label>
          <Input
            type="select"
            name="lifecycleStatus"
            value={validation.values.lifecycleStatus}
            onChange={validation.handleChange}
            invalid={validation.touched.lifecycleStatus && validation.errors.lifecycleStatus ? true : false}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="DISCONTINUED">Discontinued</option>
          </Input>
          {validation.touched.lifecycleStatus && validation.errors.lifecycleStatus && (
            <FormFeedback type="invalid">{validation.errors.lifecycleStatus}</FormFeedback>
          )}
        </div>
        <div>
          <Button type="submit" color="primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default LifecycleTab;

