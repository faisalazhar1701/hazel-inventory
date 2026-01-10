import React from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  React.useEffect(() => {
    document.title = `${title} | Hazel Inventory`;
  }, [title]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <div className="text-center py-5">
                    <h4 className="mb-3">{title}</h4>
                    {description && <p className="text-muted">{description}</p>}
                    <p className="text-muted mb-0">This page is under development.</p>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PlaceholderPage;

