class Company(models.Model):
    name = models.CharField(max_length=200,unique=True)
    email = models.EmailField(unique=True)
    approved = models.BooleanField(default=False)
    active = models.BooleanField(default=False)
    # Plan= models.ForeignKey(Plan,on_delete=models.CASCADE)
    logo = models.ImageField(upload_to=company_directory_path,default='Company/dafault.png')
    registered_date= models.DateTimeField(auto_now_add=True)



    class Meta:
        ordering = ['-registered_date']

    



  
    def __str__(self):
        return self.name





class OrganizationWorkflow(models.Model):
    title= models.CharField(max_length=400,db_column='title',blank=True,null=True)
    owner = models.ForeignKey(Company,on_delete=models.CASCADE,db_column='owner')

    @property
    def workflowusers_emails(self):
        workflow= OrganizationWorkflow.objects.get(id=self.id)
        queryset2= OrganizationWorkflowUser.objects.filter(workflow=workflow)

        workflowusers=[]
        for s in queryset2:
            if s.phone:
                signer={
                    "email":s.email,
                    "phone":s.phone
                }
                workflowusers.append(signer)
            else:
                signer={
                    "email":s.email
                }
                workflowusers.append(signer)
        return workflowusers

    class Meta:
        db_table='OrganizationWorkflow'

  
    def __str__(self):
        return f'{self.title} - {self.owner.email}'

class OrganizationWorkflowUser(models.Model):
    fullname =  models.CharField(max_length=400,db_column='fullname',blank=True,null=True)
    email = models.CharField(max_length=400,db_column='email',blank=True,null=True)
    phone = models.CharField(max_length=400,db_column='phone',blank=True,null=True)
    otpverification = models.BooleanField(default=False,db_column='otpverification',blank=True,null=True)
    workflow = models.ForeignKey(OrganizationWorkflow,on_delete=models.CASCADE,db_column='workflow')


    class Meta:
        db_table='OrganizationWorkflowUser'

   
    def __str__(self):
        return self.fullname
