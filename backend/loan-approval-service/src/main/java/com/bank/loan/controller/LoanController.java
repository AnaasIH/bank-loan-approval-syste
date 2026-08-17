package com.bank.loan.controller;

import com.bank.loan.dto.LoanRequestDto;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/loans")
@CrossOrigin(origins = "*")
public class LoanController {

    @Autowired
    private RuntimeService runtimeService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private HistoryService historyService; // الخدمة المسؤولة عن الأرشيف والسجلات

    // 1. تقديم طلب جديد
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyForLoan(@RequestBody LoanRequestDto request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("customerName", request.getCustomerName());
        variables.put("amount", request.getAmount());

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("loan-approval-process", variables);

        Map<String, Object> response = new HashMap<>();
        response.put("processInstanceId", processInstance.getId());
        response.put("status", "Loan request submitted successfully");

        return ResponseEntity.ok(response);
    }

    // 2. جلب قائمة المهام المنتظرة للموظف
    @GetMapping("/tasks")
    public ResponseEntity<List<Map<String, Object>>> getPendingTasks() {
        List<Task> tasks = taskService.createTaskQuery().taskDefinitionKey("Activity_ManualReview").list();
        if (tasks.isEmpty()) {
            tasks = taskService.createTaskQuery().list();
        }

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Task task : tasks) {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("taskId", task.getId());
            taskMap.put("taskName", task.getName());
            taskMap.put("createTime", task.getCreateTime());

            Map<String, Object> variables = taskService.getVariables(task.getId());
            taskMap.put("customerName", variables.get("customerName"));
            taskMap.put("amount", variables.get("amount"));

            responseList.add(taskMap);
        }

        return ResponseEntity.ok(responseList);
    }

    // 3. اتخاذ قرار وإكمال المهمة (قبول / رفض)
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Map<String, String>> completeTask(@PathVariable String taskId, @RequestParam boolean approved) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);

        taskService.complete(taskId, variables);

        Map<String, String> response = new HashMap<>();
        response.put("status", "Task completed with approval: " + approved);
        return ResponseEntity.ok(response);
    }


    // 4. جلب سجل جميع الطلبات السابقة لعميل معين (جديد)
    @GetMapping("/history/{customerName}")
    public ResponseEntity<List<Map<String, Object>>> getCustomerHistory(@PathVariable String customerName) {
        // البحث في أرشيف Camunda عن طلبات هذا العميل
        List<HistoricProcessInstance> historicInstances = historyService.createHistoricProcessInstanceQuery()
                .processDefinitionKey("loan-approval-process")
                .variableValueEquals("customerName", customerName)
                .orderByProcessInstanceStartTime().desc()
                .list();

        List<Map<String, Object>> historyList = new ArrayList<>();

        for (HistoricProcessInstance instance : historicInstances) {
            Map<String, Object> map = new HashMap<>();
            map.put("processInstanceId", instance.getId());
            map.put("startTime", instance.getStartTime());
            map.put("endTime", instance.getEndTime());

            // جلب قيمة المبلغ وقرار القبول/الرفض المخزنة
            List<HistoricVariableInstance> historicVariables = historyService.createHistoricVariableInstanceQuery()
                    .processInstanceId(instance.getId())
                    .list();

            Object amount = null;
            Object approved = null;

            for (HistoricVariableInstance varInstance : historicVariables) {
                if ("amount".equals(varInstance.getVariableName())) {
                    amount = varInstance.getValue();
                }
                if ("approved".equals(varInstance.getVariableName())) {
                    approved = varInstance.getValue();
                }
            }

            map.put("amount", amount);

            // تحديد حالة الطلب للعرض في الـ Frontend
            String status;
            if (instance.getEndTime() == null) {
                status = "PENDING"; // قيد المراجعة اليدوية
            } else if (Boolean.TRUE.equals(approved)) {
                status = "APPROVED"; // تم القبول
            } else if (Boolean.FALSE.equals(approved)) {
                status = "REJECTED"; // تم الرفض
            } else {
                // الطلبات الأقل من 50,000 تكتمل فوراً ومقبولة تلقائياً
                status = "APPROVED";
            }

            map.put("status", status);
            historyList.add(map);
        }

        return ResponseEntity.ok(historyList);
    }


    // 5. جلب جميع الطلبات لكافة العملاء (خاصة بلوحة الإدارة - Admin Dashboard)
    @GetMapping("/admin/all-loans")
    public ResponseEntity<List<Map<String, Object>>> getAllLoansForAdmin() {
        List<HistoricProcessInstance> historicInstances = historyService.createHistoricProcessInstanceQuery()
                .processDefinitionKey("loan-approval-process")
                .orderByProcessInstanceStartTime().desc()
                .list();

        List<Map<String, Object>> allLoansList = new ArrayList<>();

        for (HistoricProcessInstance instance : historicInstances) {
            Map<String, Object> map = new HashMap<>();
            map.put("processInstanceId", instance.getId());
            map.put("startTime", instance.getStartTime());
            map.put("endTime", instance.getEndTime());

            List<HistoricVariableInstance> historicVariables = historyService.createHistoricVariableInstanceQuery()
                    .processInstanceId(instance.getId())
                    .list();

            Object customerName = "غير محدد";
            Object amount = null;
            Object approved = null;

            for (HistoricVariableInstance varInstance : historicVariables) {
                if ("customerName".equals(varInstance.getVariableName())) {
                    customerName = varInstance.getValue();
                }
                if ("amount".equals(varInstance.getVariableName())) {
                    amount = varInstance.getValue();
                }
                if ("approved".equals(varInstance.getVariableName())) {
                    approved = varInstance.getValue();
                }
            }

            map.put("customerName", customerName);
            map.put("amount", amount);

            String status;
            if (instance.getEndTime() == null) {
                status = "PENDING";
            } else if (Boolean.TRUE.equals(approved)) {
                status = "APPROVED";
            } else if (Boolean.FALSE.equals(approved)) {
                status = "REJECTED";
            } else {
                status = "APPROVED"; // القروض أقل من 50,000 المقبولة تلقائياً
            }

            map.put("status", status);
            allLoansList.add(map);
        }

        return ResponseEntity.ok(allLoansList);
    }
}