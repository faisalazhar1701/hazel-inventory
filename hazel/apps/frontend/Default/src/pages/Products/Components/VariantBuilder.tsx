import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Label,
  Input,
  Button,
  Table,
  Badge,
  InputGroup,
} from 'reactstrap';
import FeatherIcon from 'feather-icons-react';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export interface VariantOption {
  color: string;
  size: string;
  price?: number;
  status?: 'Active' | 'Inactive';
}

interface VariantBuilderProps {
  productCode: string;
  variants: VariantOption[];
  onVariantsChange: (variants: VariantOption[]) => void;
}

const VariantBuilder: React.FC<VariantBuilderProps> = ({
  productCode,
  variants,
  onVariantsChange,
}) => {
  const [colors, setColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');

  const sizes = DEFAULT_SIZES;

  const addColor = useCallback(() => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
      setColorInput('');
    }
  }, [colorInput, colors]);

  const removeColor = useCallback(
    (colorToRemove: string) => {
      setColors((prev) => prev.filter((c) => c !== colorToRemove));
    },
    [],
  );

  const toggleSize = useCallback((size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }, []);

  // Auto-generate variants when colors or selected sizes change
  useEffect(() => {
    if (!colors.length || !selectedSizes.length) {
      onVariantsChange([]);
      return;
    }
    const generated: VariantOption[] = [];
    colors.forEach((color) => {
      selectedSizes.forEach((size) => {
        const existing = variants.find((v) => v.color === color && v.size === size);
        generated.push({
          color,
          size,
          price: existing?.price ?? 0,
          status: existing?.status ?? 'Active',
        });
      });
    });
    onVariantsChange(generated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, selectedSizes]);

  const updateVariant = useCallback(
    (index: number, field: keyof VariantOption, value: string | number) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], [field]: value };
      onVariantsChange(updated);
    },
    [variants, onVariantsChange],
  );

  const removeVariant = useCallback(
    (index: number) => {
      onVariantsChange(variants.filter((_, i) => i !== index));
    },
    [variants, onVariantsChange],
  );

  return (
    <Card>
      <CardHeader>
        <h5 className="card-title mb-0">Variants</h5>
        <p className="text-muted mb-0 small">Add colors and select sizes — variants auto-generate</p>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <Label className="form-label fw-semibold">Colors</Label>
              <InputGroup>
                <Input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  placeholder="Type color and press Enter"
                />
                <Button color="primary" onClick={addColor}>
                  <FeatherIcon icon="plus" size={14} />
                </Button>
              </InputGroup>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Badge
                    key={color}
                    color="primary"
                    className="p-2 d-flex align-items-center gap-1"
                  >
                    {color}
                    <FeatherIcon
                      icon="x"
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeColor(color)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <Label className="form-label fw-semibold">Sizes (select)</Label>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {sizes.map((size) => (
                  <Button
                    key={size}
                    color={selectedSizes.includes(size) ? 'info' : 'light'}
                    size="sm"
                    outline={!selectedSizes.includes(size)}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {variants.length > 0 && (
          <div className="table-responsive">
            <Table className="table-nowrap align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Variant (Color / Size)</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={`${variant.color}-${variant.size}-${index}`}>
                    <td>
                      <strong>
                        {variant.color} / {variant.size}
                      </strong>
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price ?? 0}
                        onChange={(e) =>
                          updateVariant(index, 'price', parseFloat(e.target.value) || 0)
                        }
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <Input
                        type="select"
                        value={variant.status ?? 'Active'}
                        onChange={(e) =>
                          updateVariant(index, 'status', e.target.value as 'Active' | 'Inactive')
                        }
                        style={{ width: '120px' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </Input>
                    </td>
                    <td className="text-end">
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <FeatherIcon icon="trash-2" size={14} />
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
  );
};

export default VariantBuilder;
