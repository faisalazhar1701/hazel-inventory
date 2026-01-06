import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  CardHeader,
  Collapse,
  Spinner
} from "reactstrap";

import classnames from "classnames";
import { Link, useParams } from "react-router-dom";

import BreadCrumb from "../../../Components/Common/BreadCrumb";
import EcommerceOrderProduct from "./EcommerceOrderProduct";
import avatar3 from "../../../assets/images/users/avatar-3.jpg";
import { ordersApi, OrderDetailResponse } from "../../../api/orders";
import { mapOrderStatusToUI } from "../../../api/orders";

const EcommerceOrderDetail = (props:any) => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [col1, setcol1] = useState<boolean>(true);
  const [col2, setcol2] = useState<boolean>(true);
  const [col3, setcol3] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      ordersApi.getOrderById(id)
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching order details:", err);
          setError("Failed to load order details.");
          setLoading(false);
        });
    } else {
      setError("Order ID is missing.");
      setLoading(false);
    }
  }, [id]);

  function togglecol1() {
    setcol1(!col1);
  }

  function togglecol2() {
    setcol2(!col2);
  }

  function togglecol3() {
    setcol3(!col3);
  }

document.title ="Order Details | Hazel Inventory";
  
  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Order Details" pageTitle="Ecommerce" />
          <div className="py-4 text-center">
            <Spinner className="text-primary" />
            <div className="mt-2">
              <p className="text-muted">Loading order details...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Order Details" pageTitle="Ecommerce" />
          <div className="py-4 text-center">
            <div>
              <i className="ri-error-warning-line display-5 text-danger"></i>
            </div>
            <div className="mt-4">
              <h5>Error Loading Order</h5>
              <p className="text-muted">{error || "Order not found"}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const orderStatus = mapOrderStatusToUI(order.status);
  const totalAmount = order.totalAmount;
  const currency = order.currency;

  return (
    <div className="page-content">
      <Container fluid>        
        <BreadCrumb title="Order Details" pageTitle="Ecommerce" />

        <Row>
          <Col xl={9}>
            <Card>
              <CardHeader>
                <div className="d-flex align-items-center">
                  <h5 className="card-title flex-grow-1 mb-0">Order #{order.orderNumber}</h5>
                  <div className="flex-shrink-0 me-2">
                    <span className={`badge text-uppercase ${
                      orderStatus === "Delivered" ? "bg-success-subtle text-success" :
                      orderStatus === "Cancelled" ? "bg-danger-subtle text-danger" :
                      orderStatus === "Returns" ? "bg-primary-subtle text-primary" :
                      "bg-warning-subtle text-warning"
                    }`}>
                      {orderStatus}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="badge bg-info-subtle text-info me-2">{order.channel}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to="/apps-invoices-details"
                      className="btn btn-success btn-sm"
                    >
                      <i className="ri-download-2-fill align-middle me-1"></i>{" "}
                      Invoice
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="table-responsive table-card">
                  <table className="table table-nowrap align-middle table-borderless mb-0">
                    <thead className="table-light text-muted">
                      <tr>
                        <th scope="col">Product Details</th>
                        <th scope="col">Item Price</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Rating</th>
                        <th scope="col" className="text-end">
                          Total Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        order.orderItems.map((item, key) => (
                          <EcommerceOrderProduct 
                            product={{
                              id: item.id,
                              img: '',
                              name: item.productVariant?.product?.name || 'Product',
                              category: item.productVariant?.sku || 'N/A',
                              price: item.unitPrice,
                              qty: item.quantity,
                              total: item.totalPrice,
                              rating: 0,
                            }} 
                            key={key} 
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4">
                            <p className="text-muted mb-0">No items in this order</p>
                          </td>
                        </tr>
                      )}
                      <tr className="border-top border-top-dashed">
                        <td colSpan={3}></td>
                        <td colSpan={2} className="fw-medium p-0">
                          <table className="table table-borderless mb-0">
                            <tbody>
                              <tr>
                                <td>Sub Total :</td>
                                <td className="text-end">{currency} {totalAmount.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td>Shipping Charge :</td>
                                <td className="text-end">{currency} 0.00</td>
                              </tr>
                              <tr>
                                <td>Estimated Tax :</td>
                                <td className="text-end">{currency} 0.00</td>
                              </tr>
                              <tr className="border-top border-top-dashed">
                                <th scope="row">Total ({currency}) :</th>
                                <th className="text-end">{currency} {totalAmount.toFixed(2)}</th>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="d-sm-flex align-items-center">
                  <h5 className="card-title flex-grow-1 mb-0">Order Status</h5>
                  <div className="flex-shrink-0 mt-2 mt-sm-0">
                    <Link
                      to="#"
                      className="btn btn-soft-info btn-sm mt-2 mt-sm-0"
                    >
                      <i className="ri-map-pin-line align-middle me-1"></i>{" "}
                      Change Address
                    </Link>{" "}
                    <Link
                      to="#"
                      className="btn btn-soft-danger btn-sm mt-2 mt-sm-0"
                    >
                      <i className="mdi mdi-archive-remove-outline align-middle me-1"></i>{" "}
                      Cancel Order
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="profile-timeline">
                  <div
                    className="accordion accordion-flush"
                    id="accordionFlushExample"
                  >
                    <div className="accordion-item border-0" onClick={togglecol1}>
                      <div className="accordion-header" id="headingOne">
                        <Link to="#" className={classnames(
                          "accordion-button",
                          "p-2",
                          "shadow-none",
                          { collapsed: !col1 }

                        )}>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className="avatar-title bg-success rounded-circle">
                                <i className="ri-shopping-bag-line"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-15 mb-0 fw-semibold">
                                Order Placed -{" "}
                                <span className="fw-normal">
                                  Wed, 15 Dec 2021
                                </span>
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <Collapse
                        id="collapseOne"
                        className="accordion-collapse"
                        isOpen={col1}
                      >
                        <div className="accordion-body ms-2 ps-5 pt-0">
                          <h6 className="mb-1">An order has been placed.</h6>
                          <p className="text-muted">
                            Wed, 15 Dec 2021 - 05:34PM
                          </p>

                          <h6 className="mb-1">
                            Seller has processed your order.
                          </h6>
                          <p className="text-muted mb-0">
                            Thu, 16 Dec 2021 - 5:48AM
                          </p>
                        </div>
                      </Collapse>
                    </div>
                    <div className="accordion-item border-0" onClick={togglecol2}>
                      <div className="accordion-header" id="headingTwo">
                        <Link to="#collapseTwo"
                          className={classnames(
                            "accordion-button",
                            "p-2",
                            "shadow-none",
                            { collapsed: !col2 }
                          )}
                          
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className="avatar-title bg-success rounded-circle">
                                <i className="mdi mdi-gift-outline"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-15 mb-1 fw-semibold">
                                Packed -{" "}
                                <span className="fw-normal">
                                  Thu, 16 Dec 2021
                                </span>
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <Collapse
                        id="collapseTwo"
                        className="accordion-collapse"
                        isOpen={col2}
                      >
                        <div className="accordion-body ms-2 ps-5 pt-0">
                          <h6 className="mb-1">
                            Your Item has been picked up by courier patner
                          </h6>
                          <p className="text-muted mb-0">
                            Fri, 17 Dec 2021 - 9:45AM
                          </p>
                        </div>
                      </Collapse>
                    </div>
                    <div className="accordion-item border-0" onClick={togglecol3}>
                      <div className="accordion-header" id="headingThree">
                        <Link to="#collapseThree"
                          className={classnames(
                            "accordion-button",
                            "p-2",
                            "shadow-none",
                            { collapsed: !col3 }
                          )}
                         
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className="avatar-title bg-success rounded-circle">
                                <i className="ri-truck-line"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-15 mb-1 fw-semibold">
                                Shipping -{" "}
                                <span className="fw-normal">
                                  Thu, 16 Dec 2021
                                </span>
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                      <Collapse
                        id="collapseThree"
                        className="accordion-collapse"
                        isOpen={col3}
                      >
                        <div className="accordion-body ms-2 ps-5 pt-0">
                          <h6 className="fs-14">
                            RQK Logistics - MFDS1400457854
                          </h6>
                          <h6 className="mb-1">Your item has been shipped.</h6>
                          <p className="text-muted mb-0">
                            Sat, 18 Dec 2021 - 4.54PM
                          </p>
                        </div>
                      </Collapse>
                    </div>
                    <div className="accordion-item border-0">
                      <div className="accordion-header" id="headingFour">
                        <Link to="#"
                          className="accordion-button p-2 shadow-none"
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className="avatar-title bg-light text-success rounded-circle">
                                <i className="ri-takeaway-fill"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-14 mb-0 fw-semibold">
                                Out For Delivery
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                    <div className="accordion-item border-0">
                      <div className="accordion-header" id="headingFive">
                        <Link
                          className="accordion-button p-2 shadow-none"
                          to="#"
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 avatar-xs">
                              <div className="avatar-title bg-light text-success rounded-circle">
                                <i className="mdi mdi-package-variant"></i>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="fs-14 mb-0 fw-semibold">
                                Delivered
                              </h6>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={3}>
            <Card>
              <CardHeader>
                <div className="d-flex">
                  <h5 className="card-title flex-grow-1 mb-0">
                    <i className="mdi mdi-truck-fast-outline align-middle me-1 text-muted"></i>
                    Logistics Details
                  </h5>
                  <div className="flex-shrink-0">
                    <Link to="#" className="badge bg-primary-subtle text-primary fs-11">
                      Track Order
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="text-center">
                  <i className="ri-truck-line display-5 text-danger"></i>
                  <h5 className="fs-16 mt-2">RQK Logistics</h5>
                  <p className="text-muted mb-0">ID: MFDS1400457854</p>
                  <p className="text-muted mb-0">Payment Mode : Debit Card</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="d-flex">
                  <h5 className="card-title flex-grow-1 mb-0">
                    Customer Details
                  </h5>
                  <div className="flex-shrink-0">
                    <Link to="#" className="link-secondary">
                      View Profile
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled mb-0 vstack gap-3">
                  <li>
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <img
                          src={avatar3}
                          alt=""
                          className="avatar-sm rounded"
                        />
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="fs-14 mb-1">Joseph Parkers</h6>
                        <p className="text-muted mb-0">Customer</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <i className="ri-mail-line me-2 align-middle text-muted fs-16"></i>
                    josephparker@gmail.com
                  </li>
                  <li>
                    <i className="ri-phone-line me-2 align-middle text-muted fs-16"></i>
                    +(256) 245451 441
                  </li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">
                  <i className="ri-map-pin-line align-middle me-1 text-muted"></i>{" "}
                  Billing Address
                </h5>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled vstack gap-2 fs-13 mb-0">
                  <li className="fw-medium fs-14">Joseph Parker</li>
                  <li>+(256) 245451 451</li>
                  <li>2186 Joyce Street Rocky Mount</li>
                  <li>New York - 25645</li>
                  <li>United States</li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">
                  <i className="ri-map-pin-line align-middle me-1 text-muted"></i>{" "}
                  Shipping Address
                </h5>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled vstack gap-2 fs-13 mb-0">
                  <li className="fw-medium fs-14">Joseph Parker</li>
                  <li>+(256) 245451 451</li>
                  <li>2186 Joyce Street Rocky Mount</li>
                  <li>California - 24567</li>
                  <li>United States</li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">
                  <i className="ri-secure-payment-line align-bottom me-1 text-muted"></i>{" "}
                  Payment Details
                </h5>
              </CardHeader>
              <CardBody>
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Transactions:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">#VLZ124561278124</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Payment Method:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">Debit Card</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Card Holder Name:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">Joseph Parker</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Card Number:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">xxxx xxxx xxxx 2456</h6>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <p className="text-muted mb-0">Total Amount:</p>
                  </div>
                  <div className="flex-grow-1 ms-2">
                    <h6 className="mb-0">{currency} {totalAmount.toFixed(2)}</h6>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EcommerceOrderDetail;