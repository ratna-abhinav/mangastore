package com.example.shoppingdotcom.util;

import com.example.shoppingdotcom.model.ProductOrder;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.UserService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.security.Principal;

@Component
public class CommonUtils {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserService userService;

    public Boolean sendMail(String url, String recipientEmail) throws UnsupportedEncodingException, MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);

        helper.setFrom("testnlocal@gmail.com", "Manga Store");
        helper.setTo(recipientEmail);

        String content = "<p>Hello,</p>" +
                "<p>You have requested to reset your password.</p>" +
                "<p>Click the link below to change your password:</p>" +
                "<p><a href=\"" + url +
                "\">Change my password</a></p>" +
                "<p>If you did not request a password reset, you can safely ignore this email.</p>" +
                "<p>For any questions or concerns, feel free to contact our support team.</p>" +
                "<p>Best regards,</p>" +
                "<p><strong>Manga Store Support Team</strong></p>";

        helper.setSubject("Manga Store - Password Reset Request");
        helper.setText(content, true);
        mailSender.send(message);
        return true;
    }

    public static String generateUrl(HttpServletRequest request) {
        String siteUrl = request.getRequestURL().toString();
        return siteUrl.replace(request.getServletPath(), "");
    }

    public void sendMailForProductOrder(ProductOrder order, String status) throws Exception {

        String msg = "<p>Dear [[name]],</p>"
                + "<p>We are delighted to inform you that your order is now <b>[[orderStatus]]</b>.</p>"
                + "<p>Thank you for shopping with us!</p>"
                + "<h3>Order Details:</h3>"
                + "<ul>"
                + "<li><strong>Product Name:</strong> [[productName]]</li>"
                + "<li><strong>Category:</strong> [[category]]</li>"
                + "<li><strong>Quantity:</strong> [[quantity]]</li>"
                + "<li><strong>Total Price:</strong> &#8377;[[price]]</li>"
                + "<li><strong>Payment Method:</strong> [[paymentType]]</li>"
                + "</ul>"
                + "<p>If you have any questions or need further assistance, feel free to contact us at any time.</p>"
                + "<p>Best regards,</p>"
                + "<p><strong>Manga Store Team</strong></p>";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);

        helper.setFrom("testnlocal@gmail.com", "Manga Store");
        helper.setTo(order.getOrderAddress().getEmail());

        msg = msg.replace("[[name]]", order.getOrderAddress().getFirstName());
        msg = msg.replace("[[orderStatus]]", status);
        msg = msg.replace("[[productName]]", order.getProduct().getTitle());
        msg = msg.replace("[[category]]", order.getProduct().getCategory());
        msg = msg.replace("[[quantity]]", order.getQuantity().toString());
        msg = msg.replace("[[price]]", order.getPrice().toString());
        msg = msg.replace("[[paymentType]]", order.getPaymentType());

        helper.setSubject("Your Order Status - Manga Store");
        helper.setText(msg, true);
        mailSender.send(message);
    }

    public Users getLoggedInUserDetails(Principal p) {
        String email = p.getName();
        Users user = userService.getUserByEmail(email);
        return user;
    }
}
