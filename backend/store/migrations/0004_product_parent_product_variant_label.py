import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0003_sitesettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='parent',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='variants',
                to='store.product',
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='variant_label',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
