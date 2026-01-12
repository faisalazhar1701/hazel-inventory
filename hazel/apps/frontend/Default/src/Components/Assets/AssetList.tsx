import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  Button,
  Badge,
  Spinner,
} from 'reactstrap';
import { assetsAPI, Asset } from '../../api/assets';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';
import AssetUploadModal from './AssetUploadModal';

interface AssetListProps {
  entityType: string;
  entityId: string;
}

const AssetList: React.FC<AssetListProps> = ({ entityType, entityId }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await assetsAPI.listAssets(entityType, entityId);
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      await assetsAPI.deleteAsset(assetId);
      toast.success('Asset deleted successfully');
      loadAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete asset');
    }
  };

  const handleDownload = (assetId: string) => {
    const url = assetsAPI.getDownloadUrl(assetId);
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryBadgeColor = (category: string): string => {
    switch (category) {
      case 'IMAGE':
        return 'primary';
      case 'TECH_PACK':
        return 'info';
      case 'CERTIFICATE':
        return 'success';
      case 'OTHER':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Assets</h5>
          <Button
            color="primary"
            size="sm"
            onClick={() => setUploadModalOpen(true)}
          >
            <FeatherIcon icon="upload" className="me-1" size={14} />
            Upload Asset
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
              <p className="mt-2 text-muted">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-muted mb-3">
                <FeatherIcon icon="file" size={48} />
              </div>
              <h5>No Assets</h5>
              <p className="text-muted">No assets uploaded for this entity yet.</p>
              <Button
                color="primary"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
              >
                <FeatherIcon icon="upload" className="me-1" size={14} />
                Upload First Asset
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table className="table-nowrap align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">File Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Size</th>
                    <th scope="col">Uploaded</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <FeatherIcon
                            icon="file"
                            className="me-2 text-muted"
                            size={16}
                          />
                          <span className="fw-medium">{asset.fileName}</span>
                        </div>
                      </td>
                      <td>
                        <Badge color={getCategoryBadgeColor(asset.category)}>
                          {asset.category}
                        </Badge>
                      </td>
                      <td>{formatFileSize(asset.size)}</td>
                      <td>
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            color="info"
                            size="sm"
                            onClick={() => handleDownload(asset.id)}
                            title="Download"
                          >
                            <FeatherIcon icon="download" size={14} />
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                            title="Delete"
                          >
                            <FeatherIcon icon="trash-2" size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <AssetUploadModal
        isOpen={uploadModalOpen}
        toggle={() => setUploadModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        onUploadSuccess={loadAssets}
      />
    </>
  );
};

export default AssetList;
