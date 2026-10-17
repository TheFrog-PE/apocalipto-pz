xml_content = """<?xml version="1.0" encoding="utf-8"?>
<animNode>
	<m_Name>Shot</m_Name>
	<m_AnimName>Zombie_HitReact_HeadLeft</m_AnimName>
	<m_Looped>false</m_Looped>
	<m_BlendTime>0.10</m_BlendTime>
	<m_SpeedScale>0.96</m_SpeedScale>
	<m_Conditions x_name="0cee3750-13be-4d0f-ade3-ce56a98d44f1">
		<m_Name>hitreaction</m_Name>
		<m_Type>STRING</m_Type>
		<m_Value></m_Value>
	</m_Conditions>
	<m_Events x_name="798e7f93-f590-4406-ac66-30ef3ab26861">
		<m_EventName>FallOnFront</m_EventName>
		<m_Time>Start</m_Time>
		<m_ParameterValue>false</m_ParameterValue>
	</m_Events>
	<m_Events x_name="56075d24-161e-47e7-8c02-2045c23ee69d">
		<m_EventName>Collide</m_EventName>
		<m_TimePc>0.1</m_TimePc>
		<m_ParameterValue></m_ParameterValue>
	</m_Events>
	<m_Events x_name="56075d24-161e-47e7-8c02-2045c23ee69e">
		<m_EventName>CancelKnockDown</m_EventName>
		<m_Time>Start</m_Time>
		<m_ParameterValue>true</m_ParameterValue>
	</m_Events>
	<m_Events x_name="2f401c7e-050c-484a-be3b-8b18adcbedf8">
		<m_EventName>SetState</m_EventName>
		<m_Time>Start</m_Time>
		<m_ParameterValue></m_ParameterValue>
	</m_Events>
</animNode>
"""

target = r"C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid\media\AnimSets\zombie\hitreaction\ShotDefault.xml"
with open(target, "w", encoding="utf-8") as f:
    f.write(xml_content)
print("ShotDefault.xml updated successfully with exact valid XML!")
