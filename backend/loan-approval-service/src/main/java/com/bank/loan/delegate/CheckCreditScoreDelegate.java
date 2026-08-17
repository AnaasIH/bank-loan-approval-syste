package com.bank.loan.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("checkCreditScoreDelegate")
public class CheckCreditScoreDelegate implements JavaDelegate {

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Double amount = (Double) execution.getVariable("amount");

        // منطق بسيط: إذا كان المبلغ أقل من 50000 يتم القبول تلقائياً
        boolean approved = amount != null && amount <= 50000;

        execution.setVariable("creditApproved", approved);
        System.out.println("Processing loan for amount: " + amount + " -> Approved: " + approved);
    }
}